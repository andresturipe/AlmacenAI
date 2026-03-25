"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type SaleItem = {
  productId: string;
  quantity: number;
};

export type ProcessSaleInput = {
  items: SaleItem[];
  organizationId: string;
  userId: string;
  discountPercentage?: number;
};

export type SaleResult = {
  saleId: string;
  totalUsd: number;
  itemsProcessed: number;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ──────────────────────────────────────────────
// processSale — Transacción atómica de venta
// ──────────────────────────────────────────────

export async function processSale(
  input: ProcessSaleInput
): Promise<ActionResult<SaleResult>> {
  const { userId, orgId } = await auth();
  const activeOrgId = orgId;
  
  if (!activeOrgId || !userId) {
    return { success: false, error: "Organización no seleccionada o sesión no válida." };
  }

  // Sincronizar usuario con la BD local de Prisma para evitar errores de llave foránea
  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      await prisma.user.upsert({
        where: { id: userId },
        update: { 
          organizationId: activeOrgId,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
          email: clerkUser.emailAddresses[0].emailAddress
        },
        create: {
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
          organizationId: activeOrgId,
          role: "OPERATOR",
        },
      });
    }
  } catch (userError) {
    console.error("[processSale] Error sincronizando usuario:", userError);
    // Continuamos, tal vez el usuario ya existe o el error no es crítico
  }

  const { items } = input;
  const organizationId = activeOrgId;
  const currentUserId = userId; // Override from Clerk

  if (!items || items.length === 0) {
    return { success: false, error: "La venta debe incluir al menos un producto." };
  }

  try {
    // Verificar stock ANTES de iniciar la transacción
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
    });

    // Mapa de producto por ID para acceso rápido
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validar existencia y stock suficiente
    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return {
          success: false,
          error: `Producto con ID "${item.productId}" no encontrado o no pertenece a esta organización.`,
        };
      }

      if (product.currentStock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para "${product.name}". Disponible: ${product.currentStock}, solicitado: ${item.quantity}.`,
        };
      }
    }

    // Calcular total de la venta (Subtotal base)
    const baseSubtotal = items.reduce((acc, item) => {
      const product = productMap.get(item.productId)!;
      return acc + product.priceUsd * item.quantity;
    }, 0);

    const discountPercentage = input.discountPercentage || 0;
    const discountAmount = baseSubtotal * (discountPercentage / 100);
    const taxableSubtotal = baseSubtotal - discountAmount;
    
    // Asumiendo tax del 16% igual que en el frontend
    const tax = taxableSubtotal * 0.16;
    const finalTotalUsd = taxableSubtotal + tax;

    // ── Transacción atómica ──────────────────────
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro de venta
      const newSale = await tx.sale.create({
        data: {
          totalUsd: finalTotalUsd,
          discountPercentage,
          status: "COMPLETED",
          organizationId,
          userId: currentUserId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtSale: productMap.get(item.productId)!.priceUsd,
            })),
          },
        },
      });

      // 2. Descontar stock y crear InventoryLog por cada producto
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const newStock = product.currentStock - item.quantity;

        // Restar stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Registrar movimiento en el log de inventario
        await tx.inventoryLog.create({
          data: {
            type: "VENTA",
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock,
            note: `Venta #${newSale.id}`,
            productId: item.productId,
            userId: currentUserId,
            organizationId,
          },
        });
      }

      return newSale;
    });
    // ── Fin transacción ──────────────────────────

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/inventory");

    return {
      success: true,
      data: {
        saleId: sale.id,
        totalUsd: finalTotalUsd,
        itemsProcessed: items.length,
      },
    };
  } catch (error: any) {
    console.error("[processSale] Error Detallado:", error);
    return {
      success: false,
      error: `Error técnico: ${error.message || "Error desconocido en la transacción"}`,
    };
  }
}

// ──────────────────────────────────────────────
// GET: Ventas recientes por organización
// ──────────────────────────────────────────────

export async function getSales(limit = 50) {
  try {
    const { userId, orgId } = await auth();
    const activeOrgId = orgId;
    
    if (!activeOrgId) {
      return { success: false, error: "Organización no seleccionada." } as const;
    }

    const sales = await prisma.sale.findMany({
      where: { organizationId: activeOrgId },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, data: sales } as const;
  } catch (error) {
    console.error("[getSales]", error);
    return { success: false, error: "Error al obtener las ventas." } as const;
  }
}

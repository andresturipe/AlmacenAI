"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// processSale — Transacción de Venta
// 1. Crear Venta, 2. Descontar Stock, 3. Crear Logs
// ──────────────────────────────────────────────

export type SaleItemInput = {
  productId: string;
  quantity: number;
  priceAtSale: number;
};

export async function processSale(
  organizationId: string,
  userId: string,
  items: SaleItemInput[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calcular total de la venta
      const totalUsd = items.reduce((acc, item) => acc + item.priceAtSale * item.quantity, 0);

      // 2. Crear la venta principal
      const sale = await tx.sale.create({
        data: {
          totalUsd,
          organizationId,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtSale: item.priceAtSale,
            })),
          },
        },
        include: { items: true },
      });

      // 3. Actualizar stock y crear logs para cada item
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, organizationId },
        });

        if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
        if (product.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.currentStock}`);
        }

        const newStock = product.currentStock - item.quantity;

        // Actualizar producto
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Crear audit log
        await tx.inventoryLog.create({
          data: {
            type: "VENTA",
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock,
            note: `Venta #${sale.id.slice(-6)}`,
            productId: item.productId,
            userId,
            organizationId,
          },
        });
      }

      return sale;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    return { success: true, data: result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al procesar la venta";
    return { success: false, error: msg };
  }
}

// ──────────────────────────────────────────────
// handleReturn — Revertir Venta (Solo ADMIN)
// 1. Validar Rol, 2. Revertir Stock, 3. Marcar como Returned
// ──────────────────────────────────────────────

export async function handleReturn(
  saleId: string,
  organizationId: string,
  adminUserId: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar que el usuario sea ADMIN
      const admin = await tx.user.findUnique({
        where: { id: adminUserId, organizationId },
      });

      if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
        throw new Error("Acceso denegado: Se requieren permisos de ADMINISTRADOR");
      }

      // 2. Buscar la venta y sus items
      const sale = await tx.sale.findUnique({
        where: { id: saleId, organizationId },
        include: { items: true },
      });

      if (!sale) throw new Error("Venta no encontrada");
      if (sale.status === "RETURNED") throw new Error("Esta venta ya fue devuelta");

      // 3. Revertir stock de cada item y crear log de devolución
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, organizationId },
        });

        if (product) {
          const newStock = product.currentStock + item.quantity;
          
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          await tx.inventoryLog.create({
            data: {
              type: "DEVOLUCION",
              quantity: item.quantity,
              previousStock: product.currentStock,
              newStock,
              note: `Devolución de Venta #${sale.id.slice(-6)}`,
              productId: item.productId,
              userId: adminUserId,
              organizationId,
            },
          });
        }
      }

      // 4. Marcar venta como devuelta
      return await tx.sale.update({
        where: { id: saleId },
        data: { status: "RETURNED" },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    return { success: true, data: result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al procesar la devolución";
    return { success: false, error: msg };
  }
}

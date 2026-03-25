"use server";

import { prisma } from "@/lib/db";
import { syncStockSchema, type SyncStockValues } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// syncStock — Actualizar stock y registrar en el log
// ──────────────────────────────────────────────

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> };

export async function syncStock(
  input: SyncStockValues,
  userId: string,
  organizationId: string
): Promise<ActionResult<{ newStock: number; logId: string }>> {
  // 1. Validate input with Zod
  const parsed = syncStockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Datos de entrada inválidos",
      details: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { productId, type, quantity, note } = parsed.data;

  try {
    // 2. Execute in a Prisma transaction (atomic: stock update + log creation)
    const [updatedProduct, log] = await prisma.$transaction(async (tx) => {
      // 2a. Get the current product and lock it for update
      const product = await tx.product.findUnique({
        where: { id: productId, organizationId },
      });

      if (!product) {
        throw new Error("Producto no encontrado o no pertenece a tu organización");
      }

      // 2b. Calculate the new stock based on movement type
      let newStock: number;
      switch (type) {
        case "ENTRADA":
          newStock = product.currentStock + quantity;
          break;
        case "SALIDA":
          if (product.currentStock < quantity) {
            throw new Error(
              `Stock insuficiente. Stock actual: ${product.currentStock}, cantidad solicitada: ${quantity}`
            );
          }
          newStock = product.currentStock - quantity;
          break;
        case "AJUSTE":
          // AJUSTE sets the stock to the exact quantity provided
          newStock = quantity;
          break;
        default:
          throw new Error("Tipo de movimiento inválido");
      }

      // 2c. Update the product stock
      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock, updatedAt: new Date() },
      });

      // 2d. Create the immutable log entry
      const logEntry = await tx.inventoryLog.create({
        data: {
          type,
          quantity,
          previousStock: product.currentStock,
          newStock,
          note,
          productId,
          userId,
          organizationId,
        },
      });

      return [updated, logEntry];
    });

    // 3. Revalidate the dashboard cache
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/products/${productId}`);

    return {
      success: true,
      data: {
        newStock: updatedProduct.currentStock,
        logId: log.id,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return { success: false, error: message };
  }
}

// ──────────────────────────────────────────────
// calculatePrice — Conversión USD → Moneda Local
// ──────────────────────────────────────────────

export async function calculatePrice(
  productId: string,
  targetCurrency: string,
  organizationId: string
): Promise<ActionResult<{ priceUsd: number; priceLocal: number; currency: string; rate: number }>> {
  try {
    // 1. Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId, organizationId },
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    // 2. Get the latest exchange rate for the target currency
    // P_local = P_usd × Tasa_Actual
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: {
        currency_organizationId: {
          currency: targetCurrency.toUpperCase(),
          organizationId,
        },
      },
    });

    if (!exchangeRate) {
      return {
        success: false,
        error: `Tasa de cambio para ${targetCurrency.toUpperCase()} no configurada. Ve a Configuración → Tasas de Cambio para agregar una.`,
      };
    }

    // 3. Apply the formula: P_local = P_usd × Tasa_Actual
    const priceLocal = product.priceUsd * exchangeRate.rateToUsd;

    return {
      success: true,
      data: {
        priceUsd: product.priceUsd,
        priceLocal: Math.round(priceLocal * 100) / 100, // Round to 2 decimal places
        currency: exchangeRate.currency,
        rate: exchangeRate.rateToUsd,
      },
    };
  } catch (error) {
    return { success: false, error: "Error al calcular el precio" };
  }
}

// ──────────────────────────────────────────────
// getLowStockProducts — Get products below minStock (AI Tool)
// ──────────────────────────────────────────────

export async function getLowStockProducts(organizationId: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId,
        // Products where current stock is at or below the minimum
        currentStock: { lte: prisma.product.fields.minStock },
      },
      include: { category: true },
      orderBy: { currentStock: "asc" },
    });
    return { success: true, data: products };
  } catch {
    return { success: false, error: "Error al obtener productos con stock bajo" };
  }
}

// ──────────────────────────────────────────────
// getInventoryStats — KPIs for the dashboard
// ──────────────────────────────────────────────

export async function getInventoryStats(organizationId: string) {
  try {
    const [totalProducts, lowStockCount, todayLogs] = await Promise.all([
      prisma.product.count({ where: { organizationId } }),
      prisma.product.count({
        where: {
          organizationId,
          currentStock: { lte: 0 },
        },
      }),
      prisma.inventoryLog.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      success: true,
      data: { totalProducts, lowStockCount, todayLogs },
    };
  } catch {
    return { success: false, error: "Error al obtener estadísticas" };
  }
}

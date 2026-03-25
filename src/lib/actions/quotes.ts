"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { QuoteStatus } from "@prisma/client";

export type QuoteItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateQuoteInput = {
  clientName: string;
  items: QuoteItemInput[];
  discountPercentage?: number;
  validDays?: number;
};

export async function getQuotes() {
  const { orgId } = await auth();
  if (!orgId) return { success: false, error: "No organization group found" };

  try {
    const quotes = await prisma.quote.findMany({
      where: { organizationId: orgId },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: quotes };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createQuote(input: CreateQuoteInput) {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { success: false, error: "No auth context" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.validDays || 15));

  const subtotal = input.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const discount = subtotal * ((input.discountPercentage || 0) / 100);
  const totalUsd = subtotal - discount;

  try {
    const quote = await prisma.quote.create({
      data: {
        clientName: input.clientName,
        totalUsd,
        discountPercentage: input.discountPercentage || 0,
        expiresAt,
        organizationId: orgId,
        userId: userId,
        status: "PENDIENTE",
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      }
    });

    revalidatePath("/dashboard/quotes");
    return { success: true, data: quote };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function convertToSale(quoteId: string) {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { success: false, error: "No auth context" };

  try {
    return await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId, organizationId: orgId },
        include: { items: true }
      });

      if (!quote) throw new Error("Cotización no encontrada");
      if (quote.status === "APROBADA") throw new Error("Esta cotización ya fue convertida a venta");

      // 1. Crear la Venta
      const sale = await tx.sale.create({
        data: {
          totalUsd: quote.totalUsd,
          discountPercentage: quote.discountPercentage,
          organizationId: orgId,
          userId: userId,
          items: {
            create: quote.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtSale: item.unitPrice
            }))
          }
        }
      });

      // 2. Descontar Stock y Crear Logs
      for (const item of quote.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
        
        if (product.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.currentStock}`);
        }

        const newStock = product.currentStock - item.quantity;
        
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock }
        });

        await tx.inventoryLog.create({
          data: {
            type: "VENTA",
            quantity: item.quantity,
            previousStock: product.currentStock,
            newStock,
            note: `Venta #${sale.id} (desde Cotización #${quote.id})`,
            productId: item.productId,
            userId,
            organizationId: orgId
          }
        });
      }

      // 3. Marcar cotización como aprobada
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "APROBADA" }
      });

      return { success: true, saleId: sale.id };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/inventory");
  }
}

import "server-only";
import { PrismaClient } from "@prisma/client";

// Singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Centralized Data Functions
export async function getDashboardData(orgId: string) {
  const [recentProducts, allProducts, todayLogs, salesToday] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: orgId },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.product.findMany({
      where: { organizationId: orgId },
      select: { currentStock: true, minStock: true, priceUsd: true }
    }),
    prisma.inventoryLog.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.sale.aggregate({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { totalUsd: true },
    }),
  ]);

  const lowStockCount = allProducts.filter(
    (p: { currentStock: number; minStock: number }) => p.currentStock <= p.minStock
  ).length;

  const totalValueUsd = allProducts.reduce(
    (acc: number, p: { priceUsd: number; currentStock: number }) => acc + (p.priceUsd * p.currentStock), 0
  );

  return {
    products: recentProducts,
    stats: {
      totalValueUsd,
      lowStockCount,
      todayLogs,
      salesTodayUsd: salesToday._sum.totalUsd ?? 0,
    },
  };
}

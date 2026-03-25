import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { prisma } from "@/lib/db";

// ──────────────────────────────────────────────
// updateExchangeRates — Cron function (Inngest v4 API)
// Runs every hour and fetches rates from Open Exchange Rates API
// Requires: OPEN_EXCHANGE_RATES_APP_ID in .env
// ──────────────────────────────────────────────

export const updateExchangeRates = inngest.createFunction(
  { id: "update-exchange-rates", name: "Actualizar Tasas de Cambio (Cron)", retries: 3 },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;

    if (!appId) {
      console.warn("OPEN_EXCHANGE_RATES_APP_ID no configurado. Saltando actualización automática.");
      return { skipped: true, reason: "Missing API key" };
    }

    // Step 1: Fetch rates from external API
    const rates = await step.run("fetch-rates-from-api", async () => {
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`
      );
      if (!response.ok) {
        throw new NonRetriableError(`API error: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as { rates: Record<string, number> };
      return data.rates;
    });

    // Step 2: Update all auto-managed rates in the database
    const updated = await step.run("update-database", async () => {
      const existingRates = await prisma.exchangeRate.findMany({
        where: { source: { not: "manual" } },
        select: { currency: true, organizationId: true },
      });

      const updateOps = existingRates
        .filter(({ currency }) => rates[currency] !== undefined)
        .map(({ currency, organizationId }) =>
          prisma.exchangeRate.update({
            where: { currency_organizationId: { currency, organizationId } },
            data: { rateToUsd: rates[currency], source: "openexchangerates", createdAt: new Date() },
          })
        );

      await prisma.$transaction(updateOps);
      return { updatedCount: updateOps.length };
    });

    console.info(`✅ Tasas actualizadas: ${updated.updatedCount} registros`);
    return { success: true, ...updated };
  }
);

// ──────────────────────────────────────────────
// checkLowStockAlert — Event-driven function (Inngest v4 API)
// Triggered by the "valtek/inventory.updated" event
// ──────────────────────────────────────────────

export const checkLowStockAlert = inngest.createFunction(
  { id: "check-low-stock-alert", name: "Verificar Alertas de Stock Bajo" },
  { event: "valtek/inventory.updated" },
  async ({ event, step }) => {
    const { productId, organizationId } = event.data as {
      productId: string;
      organizationId: string;
      newStock: number;
    };

    const alertData = await step.run("check-product-stock", async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId, organizationId },
      });
      if (!product) return null;
      return { product, isLow: product.currentStock <= product.minStock };
    });

    if (alertData?.isLow) {
      console.warn(
        `⚠️ ALERTA: Producto "${alertData.product.name}" ` +
        `(SKU: ${alertData.product.sku}) tiene stock bajo: ` +
        `${alertData.product.currentStock} / mínimo: ${alertData.product.minStock}`
      );
      // TODO: Conectar notificación (email, Slack, webhook)
    }

    return { checked: true, isLow: alertData?.isLow ?? false };
  }
);

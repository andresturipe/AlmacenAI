"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// updateExchangeRateManual — Manual update for exchange rate
// ──────────────────────────────────────────────

export async function updateExchangeRateManual(
  currency: string,
  rateToUsd: number,
  organizationId: string
) {
  try {
    const rate = await prisma.exchangeRate.upsert({
      where: {
        currency_organizationId: {
          currency: currency.toUpperCase(),
          organizationId,
        },
      },
      update: { rateToUsd, source: "manual", createdAt: new Date() },
      create: {
        currency: currency.toUpperCase(),
        rateToUsd,
        source: "manual",
        organizationId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: rate };
  } catch (error) {
    return { success: false, error: "Error al actualizar la tasa de cambio" };
  }
}

// ──────────────────────────────────────────────
// getLatestRates — Get all rates for an organization
// ──────────────────────────────────────────────

export async function getLatestRates(organizationId: string) {
  try {
    const rates = await prisma.exchangeRate.findMany({
      where: { organizationId },
      orderBy: { currency: "asc" },
    });
    return { success: true, data: rates };
  } catch {
    return { success: false, error: "Error al obtener tasas de cambio" };
  }
}

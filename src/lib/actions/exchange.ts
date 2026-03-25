"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ──────────────────────────────────────────────
// GET: Tasa de cambio más reciente
// ──────────────────────────────────────────────

export async function getLatestExchangeRate(
  organizationId: string,
  currency = "VES"
): Promise<ActionResult<{ id: string; currency: string; rateToUsd: number; source: string; createdAt: Date }>> {
  try {
    const rate = await prisma.exchangeRate.findFirst({
      where: { organizationId, currency },
      orderBy: { createdAt: "desc" },
    });

    if (!rate) {
      return {
        success: false,
        error: `No hay tasa de cambio registrada para ${currency} en esta organización.`,
      };
    }

    return { success: true, data: rate };
  } catch (error) {
    console.error("[getLatestExchangeRate]", error);
    return { success: false, error: "Error al obtener la tasa de cambio." };
  }
}

// ──────────────────────────────────────────────
// GET: Todas las tasas de cambio de una organización
// ──────────────────────────────────────────────

export async function getAllExchangeRates(organizationId: string) {
  try {
    const rates = await prisma.exchangeRate.findMany({
      where: { organizationId },
      orderBy: [{ currency: "asc" }, { createdAt: "desc" }],
    });
    return { success: true, data: rates } as const;
  } catch (error) {
    console.error("[getAllExchangeRates]", error);
    return { success: false, error: "Error al obtener las tasas de cambio." } as const;
  }
}

// ──────────────────────────────────────────────
// UPDATE / UPSERT: Actualizar tasa de cambio
// ──────────────────────────────────────────────

export async function updateExchangeRate(
  organizationId: string,
  currency: string,
  rateToUsd: number,
  source: "manual" | "openexchangerates" = "manual"
): Promise<ActionResult<{ id: string; currency: string; rateToUsd: number }>> {
  if (rateToUsd <= 0) {
    return {
      success: false,
      error: "La tasa de cambio debe ser un valor positivo.",
    };
  }

  try {
    // Usa upsert para crear o actualizar la tasa de esa moneda
    const rate = await prisma.exchangeRate.upsert({
      where: {
        currency_organizationId: { currency, organizationId },
      },
      update: {
        rateToUsd,
        source,
        createdAt: new Date(), // Registrar fecha de la actualización
      },
      create: {
        currency,
        rateToUsd,
        source,
        organizationId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: { id: rate.id, currency: rate.currency, rateToUsd: rate.rateToUsd },
    };
  } catch (error) {
    console.error("[updateExchangeRate]", error);
    return { success: false, error: "Error al actualizar la tasa de cambio." };
  }
}

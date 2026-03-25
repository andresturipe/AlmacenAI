import { z } from "zod";

// ──────────────────────────────────────────────
// Product Schemas
// ──────────────────────────────────────────────

export const productSchema = z.object({
  sku: z
    .string()
    .min(2, "SKU debe tener al menos 2 caracteres")
    .max(64, "SKU demasiado largo")
    .regex(/^[A-Z0-9\-_]+$/i, "SKU solo puede contener letras, números, guiones y guiones bajos"),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(255, "Nombre demasiado largo"),
  description: z.string().max(1000).optional(),
  priceUsd: z
    .number()
    .min(0, "El precio no puede ser negativo"),
  minStock: z
    .number()
    .int("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo"),
  categoryId: z.string().cuid().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ──────────────────────────────────────────────
// Inventory Sync Schema
// ──────────────────────────────────────────────

export const syncStockSchema = z.object({
  productId: z.string().cuid("ID de producto inválido"),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]).refine(
    (val) => ["ENTRADA", "SALIDA", "AJUSTE"].includes(val),
    { message: "Tipo de movimiento inválido. Usa ENTRADA, SALIDA o AJUSTE" }
  ),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  note: z.string().max(500, "Nota demasiado larga").optional(),
});

export type SyncStockValues = z.infer<typeof syncStockSchema>;

// ──────────────────────────────────────────────
// ExchangeRate Schema
// ──────────────────────────────────────────────

export const exchangeRateSchema = z.object({
  currency: z
    .string()
    .length(3, "La moneda debe tener exactamente 3 caracteres (ej: VES)")
    .toUpperCase(),
  rateToUsd: z
    .number()
    .positive("La tasa de cambio debe ser mayor a 0"),
});

export type ExchangeRateValues = z.infer<typeof exchangeRateSchema>;

// ──────────────────────────────────────────────
// Organization Schema
// ──────────────────────────────────────────────

export const organizationSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
});

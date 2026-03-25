"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  priceUsd: number;
  minStock: number;
  currentStock: number;
  categoryId?: string;
  organizationId: string;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ──────────────────────────────────────────────
// GET: Lista de productos por organización
// ──────────────────────────────────────────────

export async function getProducts() {
  try {
    const { userId, orgId } = await auth();
    const activeOrgId = orgId;
    
    if (!activeOrgId) {
      return { success: false, error: "Organización no disponible." } as const;
    }

    const products = await prisma.product.findMany({
      where: { organizationId: activeOrgId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: products } as const;
  } catch (error) {
    console.error("[getProducts]", error);
    return { success: false, error: "Error al obtener los productos." } as const;
  }
}

// ──────────────────────────────────────────────
// GET: Producto por ID
// ──────────────────────────────────────────────

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      return { success: false, error: "Producto no encontrado." } as const;
    }
    return { success: true, data: product } as const;
  } catch (error) {
    console.error("[getProductById]", error);
    return { success: false, error: "Error al obtener el producto." } as const;
  }
}

// ──────────────────────────────────────────────
// CREATE: Crear un nuevo producto
// ──────────────────────────────────────────────

export async function createProduct(
  input: Omit<ProductInput, "organizationId">
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId } = await auth();
    const activeOrgId = orgId;
    
    if (!activeOrgId) {
      return { success: false, error: "Organización no seleccionada." };
    }

    // Auto-sincronizar la organización de Clerk a Prisma para evitar errores de Foreign Key
    await prisma.organization.upsert({
      where: { id: activeOrgId },
      update: {},
      create: {
        id: activeOrgId,
        name: "Organización Sincronizada",
        slug: activeOrgId,
      }
    });

    const product = await prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        description: input.description,
        priceUsd: input.priceUsd,
        minStock: input.minStock,
        currentStock: input.currentStock,
        categoryId: input.categoryId ?? null,
        organizationId: activeOrgId,
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { id: product.id } };
  } catch (error: any) {
    console.error("ERROR TÉCNICO:", error);

    // Detectar duplicado de SKU
    if (error?.code === "P2002") {
      return {
        success: false,
        error: `El SKU "${input.sku}" ya existe en esta organización.`,
      };
    }

    return { 
      success: false, 
      error: error?.message || "Error al crear el producto." 
    };
  }
}

// ──────────────────────────────────────────────
// UPDATE: Editar un producto existente
// ──────────────────────────────────────────────

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priceUsd !== undefined && { priceUsd: input.priceUsd }),
        ...(input.minStock !== undefined && { minStock: input.minStock }),
        ...(input.currentStock !== undefined && { currentStock: input.currentStock }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { id: product.id } };
  } catch (error: unknown) {
    console.error("[updateProduct]", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return { success: false, error: "Producto no encontrado para editar." };
    }

    return { success: false, error: "Error al editar el producto." };
  }
}

// ──────────────────────────────────────────────
// DELETE: Eliminar un producto
// ──────────────────────────────────────────────

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const { orgRole } = await auth();
    if (orgRole !== 'org:admin') {
      return { success: false, error: "Privilegios insuficientes para eliminar productos." };
    }

    await prisma.product.delete({ where: { id } });
    revalidatePath("/dashboard/inventory");
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error("[deleteProduct]", error);
    return { success: false, error: "Error al eliminar el producto." };
  }
}

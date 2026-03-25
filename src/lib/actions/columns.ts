"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCustomColumns(categoryId: string) {
  try {
    const { orgId } = await auth();
    if (!orgId) return { success: false, error: "Organización no seleccionada." } as const;

    const columns = await prisma.customColumn.findMany({
      where: { organizationId: orgId, categoryId },
      orderBy: { createdAt: "asc" },
    });
    
    return { success: true, data: columns } as const;
  } catch (error) {
    console.error("[getCustomColumns]", error);
    return { success: false, error: "Error al obtener las columnas personalizadas." } as const;
  }
}

export async function createCustomColumn(
  name: string,
  categoryId: string,
  type: "PERCENTAGE_ADD" | "PERCENTAGE_SUB" | "NUMBER" | "TEXT" = "PERCENTAGE_ADD"
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId } = await auth();
    if (!orgId) return { success: false, error: "Organización no seleccionada." };

    const column = await prisma.customColumn.create({
      data: {
        name,
        type,
        organizationId: orgId,
        categoryId,
      },
    });

    revalidatePath(`/dashboard/inventory/${categoryId}`);
    return { success: true, data: { id: column.id } };
  } catch (error: any) {
    console.error("[createCustomColumn]", error);
    if (error?.code === "P2002") {
      return { success: false, error: "Ya existe una celda con este nombre." };
    }
    return { success: false, error: "Error al crear la celda." };
  }
}

export async function deleteCustomColumn(id: string, categoryId: string): Promise<ActionResult> {
  try {
    const { orgId, orgRole } = await auth();
    if (!orgId) return { success: false, error: "Organización no seleccionada." };
    if (orgRole !== 'org:admin') {
      return { success: false, error: "Privilegios insuficientes." };
    }

    await prisma.customColumn.delete({
      where: { id, organizationId: orgId, categoryId },
    });

    revalidatePath(`/dashboard/inventory/${categoryId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteCustomColumn]", error);
    return { success: false, error: "Error al eliminar la celda." };
  }
}

export async function updateProductColumnValue(
  productId: string,
  columnId: string,
  value: string
): Promise<ActionResult> {
  try {
    const { orgId } = await auth();
    if (!orgId) return { success: false, error: "Sin organización." };

    await prisma.productColumnValue.upsert({
      where: {
        productId_columnId: { productId, columnId },
      },
      update: { value },
      create: {
        productId,
        columnId,
        value,
      },
    });

    // We don't revalidate path here routinely to avoid flashing the UI during typing,
    // since the client state already tracks this dynamically.
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateProductColumnValue]", error);
    return { success: false, error: "Error al actualizar celda." };
  }
}

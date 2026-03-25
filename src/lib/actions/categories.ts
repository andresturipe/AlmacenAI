"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ActionResult } from "./products";

export type CategoryInput = {
  name: string;
};

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId } = await auth();
    const activeOrgId = orgId;
    
    if (!activeOrgId) {
      return { success: false, error: "Organización no seleccionada." };
    }

    // Upserting is handled previously, we can assume the organization exists or upsert it just in case
    await prisma.organization.upsert({
      where: { id: activeOrgId },
      update: {},
      create: {
        id: activeOrgId,
        name: "Organización Sincronizada",
        slug: activeOrgId,
      }
    });

    const category = await prisma.category.create({
      data: {
        name: input.name,
        organizationId: activeOrgId,
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: { id: category.id } };
  } catch (error: any) {
    console.error("[createCategory] ERROR:", error);

    // Detección de duplicados by unique constraint `@@unique([name, organizationId])`
    if (error?.code === "P2002") {
      return {
        success: false,
        error: `La categoría "${input.name}" ya existe en tu organización.`,
      };
    }

    return { 
      success: false, 
      error: error?.message || "Error al crear la categoría." 
    };
  }
}

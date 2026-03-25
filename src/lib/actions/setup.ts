"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function migrateDemoDataToUser() {
  const { userId, orgId } = await auth();
  const activeId = orgId || userId;

  if (!activeId || !userId) return { success: false, message: "No auth" };

  try {
    const demoOrg = await prisma.organization.findUnique({ where: { id: "org_demo" } });
    if (!demoOrg) return { success: true, message: "Ya migrado" };

    // Create the organization with the user's ID
    await prisma.organization.create({
      data: {
        id: activeId,
        name: "Valtek-Admin",
        slug: `valtek-admin-${activeId}`,
      }
    });

    // Migrate relations
    await prisma.product.updateMany({ where: { organizationId: "org_demo" }, data: { organizationId: activeId } });
    await prisma.exchangeRate.updateMany({ where: { organizationId: "org_demo" }, data: { organizationId: activeId } });
    
    // We also need to assign a valid user to logs and sales.
    // We'll create a dummy user record in our DB linked to the Clerk ID if it doesn't exist
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "admin@valtek.com",
        name: "Valtek Admin",
        role: "SUPER_ADMIN",
        organizationId: activeId
      }
    });

    await prisma.inventoryLog.updateMany({ where: { organizationId: "org_demo" }, data: { organizationId: activeId, userId: userId } });
    await prisma.sale.updateMany({ where: { organizationId: "org_demo" }, data: { organizationId: activeId, userId: userId } });
    
    // Finally delete org_demo
    await prisma.organization.delete({ where: { id: "org_demo" } });

    revalidatePath("/", "layout");
    return { success: true, message: "Migración completa" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error migrando" };
  }
}

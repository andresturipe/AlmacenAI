"use server";

import { createClerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function toggleOrganizationSubscription(
  organizationId: string,
  currentStatus: string
) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";

  try {
    await clerkClient.organizations.updateOrganizationMetadata(organizationId, {
      publicMetadata: {
        subscriptionStatus: newStatus,
      },
    });
    
    revalidatePath("/admin/valtek");
    return { success: true };
  } catch (error) {
    console.error("Error updating organization metadata:", error);
    return { success: false, error: "Failed to update subscription status" };
  }
}

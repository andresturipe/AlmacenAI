import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Validate Super Admin
  const superAdminId = process.env.SUPER_ADMIN_CLERK_ID;

  if (!userId || userId !== superAdminId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-yellow-500/30">
      <nav className="border-b border-zinc-800/50 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/10">
              <span className="text-black font-black text-xs">V</span>
            </div>
            <span className="font-bold tracking-tight text-lg">Valtek <span className="text-zinc-500 font-medium">Control</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
            <span>Andres Turipe</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-[10px]">AT</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}

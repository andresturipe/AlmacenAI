import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { InventoryTable } from "@/components/dashboard/inventory-table";

import { auth } from "@clerk/nextjs/server";

import { getDashboardData } from "@/lib/db";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { orgId } = await auth();
  
  if (!orgId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center bg-surface text-on-surface">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">lock</span>
        <h2 className="text-2xl font-black uppercase tracking-tight">Organización Requerida</h2>
        <p className="text-sm font-bold tracking-widest text-outline uppercase mt-2">Selecciona una empresa en la barra lateral para continuar.</p>
      </div>
    );
  }

  const { products, stats } = await getDashboardData(orgId);

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
          Panel de Control
        </h1>
        <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-1">
          Vista general del almacén —{" "}
          {new Date().toLocaleDateString("es-VE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} />

      {/* Inventory Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase">
              Inventario Reciente
            </h2>
            <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              Últimos productos actualizados
            </p>
          </div>
          <a
            href="/dashboard/inventory"
            className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 border border-emerald-200 bg-white px-3 py-1.5 shadow-sm"
          >
            Ver todos
            <span className="material-symbols-outlined text-[14px]">
              arrow_forward
            </span>
          </a>
        </div>
        <InventoryTable products={products} />
      </section>
    </div>
  );
}

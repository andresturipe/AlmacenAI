import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { CreateCategoryModal } from "@/components/CreateCategoryModal";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import Link from "next/link";
import { Folder } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function InventoryCategoriesPage() {
  const { userId, orgId, orgRole } = await auth();
  const ORG_ID = orgId;
  const isAdmin = orgRole === "org:admin";

  if (!ORG_ID) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center bg-surface text-on-surface">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">lock</span>
        <h2 className="text-2xl font-black uppercase tracking-tight">Organización Requerida</h2>
        <p className="text-sm font-bold tracking-widest text-outline uppercase mt-2">Selecciona una empresa en la barra lateral para continuar.</p>
      </div>
    );
  }

  // Fetch Categories with product count
  const categories = await prisma.category.findMany({
    where: { organizationId: ORG_ID },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // KPI Calculations Global
  const allProducts = await prisma.product.findMany({
    where: { organizationId: ORG_ID }
  });

  const totalValueUsd = allProducts.reduce(
    (acc: number, p: any) => acc + p.priceUsd * p.currentStock,
    0
  );
  
  const lowStockCount = allProducts.filter((p: any) => p.currentStock <= p.minStock).length;
  const criticalCount = allProducts.filter((p: any) => p.currentStock < p.minStock).length || lowStockCount;

  const missingUnitsToRestock = allProducts.reduce((acc: number, p: any) => {
    if (p.currentStock < p.minStock) {
      return acc + (p.minStock - p.currentStock);
    }
    return acc;
  }, 0);

  const healthPercentage = allProducts.length > 0 
    ? Math.round(((allProducts.length - criticalCount) / allProducts.length) * 100) 
    : 100;

  return (
    <div className="p-6 pt-4 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar flex flex-col bg-surface font-body text-on-surface">
      {/* Action Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">
            Estructura de Inventario
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-outline uppercase font-bold tracking-widest mt-1">
            <span>Gestión por Categorías</span>
            <span className="w-1 h-1 bg-outline-variant"></span>
            <span>Global: {allProducts.length} Items</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && <CreateCategoryModal />}
        </div>
      </div>

      {/* KPI Cards Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Total Crítico (Global)
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-red-600 tracking-tight leading-none">{criticalCount}</p>
            <span className="material-symbols-outlined text-red-100 text-3xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Valor Total (USD)
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-blue-600 tracking-tight leading-none">
              ${totalValueUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <span className="material-symbols-outlined text-blue-50 text-3xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Unds. a Reabastecer
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-amber-500 tracking-tight leading-none">
              {missingUnitsToRestock} <span className="text-sm text-slate-400 ml-0.5">UDS</span>
            </p>
            <span className="material-symbols-outlined text-amber-50 text-3xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>input</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Salud Global
          </p>
          <div className="flex items-center gap-3 h-full">
            <div className="flex-1 w-full h-2 bg-slate-100 rounded-full overflow-hidden self-center">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
            <span className="text-lg font-black text-emerald-600 tracking-tight leading-none">
              {healthPercentage}%
            </span>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest border border-outline-variant rounded-md shadow-sm">
          <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
            <Folder className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-800 uppercase mb-2">Sin Entorno de Organización</h3>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest max-w-md leading-relaxed">
            Tu almacén aún no contiene categorías. Para comenzar a añadir productos, crea primero la carpeta (categoría) a la que pertenecerán.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category: any) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

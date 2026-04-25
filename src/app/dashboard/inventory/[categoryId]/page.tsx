import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { CreateProductModal } from "@/components/CreateProductModal";
import { CreateColumnModal } from "@/components/dashboard/CreateColumnModal";
import { EditableProductRow } from "@/components/dashboard/editable-product-row";
import { ColumnHeader } from "@/components/dashboard/ColumnHeader";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CategoryInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { categoryId } = await params;
  const { search: searchParam } = await searchParams;
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

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.organizationId !== ORG_ID) {
    notFound();
  }

  const search = searchParam || "";

  // Fetch all categories for the dropdown in the Create Product Modal
  const categories = await prisma.category.findMany({
    where: { organizationId: ORG_ID },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // 1. Fetch Exchange Rate (Tasa Actual)
  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { organizationId: ORG_ID },
  });
  const tasaActual = exchangeRate?.rateToUsd || 36.5;

  // 2. Fetch Dynamic Columns para esta categoría
  const customColumns = await prisma.customColumn.findMany({
    where: { organizationId: ORG_ID, categoryId },
    orderBy: { createdAt: "asc" },
  });

  // 3. Fetch Products
  const productsRaw = await prisma.product.findMany({
    where: {
      organizationId: ORG_ID,
      categoryId: categoryId,
      OR: search
        ? [
            { name: { contains: search } },
            { sku: { contains: search } },
          ]
        : undefined,
    },
    include: {
      columnValues: true,
    },
    orderBy: { name: 'asc' }
  });

  // 3. Map products to include local price
  const products = productsRaw.map((p) => ({
    ...p,
    priceLocal: p.priceUsd * tasaActual,
  }));

  const totalValueUsd = products.reduce(
    (acc, p) => acc + p.priceUsd * p.currentStock,
    0
  );
  
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;
  // Crítico real basado en consigna del usuario: productos bajo nivel mínimo
  const criticalCount = products.filter((p) => p.currentStock < p.minStock).length || lowStockCount;

  // Suma de diferencia entre lo que se necesita (minStock) y lo actual
  const missingUnitsToRestock = products.reduce((acc, p) => {
    if (p.currentStock < p.minStock) {
      return acc + (p.minStock - p.currentStock);
    }
    return acc;
  }, 0);

  const healthPercentage = products.length > 0 
    ? Math.round(((products.length - criticalCount) / products.length) * 100) 
    : 100;

  return (
    <div className="p-6 pt-4 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col bg-surface font-body text-on-surface">
      {/* Action Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/inventory" className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md transition-colors flex items-center justify-center border border-transparent hover:border-emerald-200">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">
              {category.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-outline uppercase font-bold tracking-widest ml-9">
            <span>Listado the Productos</span>
            <span className="w-1 h-1 bg-outline-variant"></span>
            <span>Tasa Activa: {tasaActual.toFixed(2)} Local/USD</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-outline-variant text-on-surface text-[10px] font-black hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm rounded-none uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">
              file_download
            </span>
            EXPORTAR CSV
          </button>
          
          {/* Botón Modal para Columnas en la Categoría Actual */}
          {isAdmin && <CreateColumnModal categoryId={categoryId} />}

          {isAdmin && <CreateProductModal categories={categories} defaultCategoryId={categoryId} />}
        </div>
      </div>

      <form method="GET" className="mb-4 relative w-full max-w-md focus-within:ring-1 focus-within:ring-emerald-500 ml-9">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
          search
        </span>
        <input
          name="search"
          defaultValue={search}
          className="w-full bg-white border border-slate-200 h-9 pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm rounded-md text-slate-700 placeholder:text-slate-400"
          placeholder="BUSCAR PRODUCTO O SKU..."
          type="text"
        />
      </form>

      {/* High-Density Grid System */}
      <div className="flex-1 bg-surface-container-lowest border border-outline-variant overflow-hidden flex flex-col ml-9 rounded-md shadow-sm">
        {/* Table Header */}
        <div 
          className="bg-emerald-50 border-b border-emerald-100 text-emerald-900 font-label text-[10px] uppercase tracking-widest font-black sticky top-0 z-10 grid"
          style={{ gridTemplateColumns: `120px 1fr 120px ${customColumns.map(() => '120px').join(' ')} 120px 120px 100px` }}
        >
          <div className="px-3 py-2 border-r border-emerald-100/50 flex flex-col justify-center">SKU</div>
          <div className="px-3 py-2 border-r border-emerald-100/50 flex flex-col justify-center">Nombre del Producto</div>
          <div className="px-3 py-2 border-r border-emerald-100/50 flex flex-col justify-center text-right">Stock Actual</div>
          
          {/* Dynamic Columns Headers */}
          {customColumns.map((col) => (
            <ColumnHeader key={col.id} col={col} categoryId={categoryId} />
          ))}

          <div className="px-3 py-2 border-r border-emerald-100/50 flex flex-col justify-center text-right">Precio Base USD</div>
          <div className="px-3 py-2 border-r border-emerald-100/50 flex flex-col justify-center text-right">Precio Base Local</div>
          <div className="px-3 py-2 text-center flex flex-col justify-center">Estado</div>
        </div>
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {products.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 h-full bg-surface">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
                <span className="material-symbols-outlined text-5xl text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase mb-1">Categoría Vacía</h3>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest max-w-sm">
                Añade productos a esta categoría para empezar a gestionarlos.
              </p>
            </div>
          ) : (
            products.map((product, idx) => (
              <EditableProductRow 
                key={product.id} 
                product={product as any} 
                columns={customColumns}
                tasaActual={tasaActual} 
                index={idx} 
              />
            ))
          )}
        </div>

        {/* Table Footer / Stats */}
        <div className="bg-slate-50 border-t border-outline-variant px-4 py-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="text-slate-600">
              Total Items: <span className="text-emerald-700 font-black ml-1">{products.length}</span>
            </span>
            <span className="text-slate-600">
              Valor Inventario (USD):{" "}
              <span className="text-emerald-700 font-black ml-1">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalValueUsd)}
              </span>
            </span>
            <span className="text-slate-600">
              Alertas: <span className="text-error font-black ml-1">{lowStockCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-6 h-6 flex items-center justify-center border border-outline-variant hover:bg-white text-slate-600 rounded-md shadow-sm bg-slate-50">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-2 text-slate-600">Página 1</span>
            <button className="w-6 h-6 flex items-center justify-center border border-outline-variant hover:bg-white text-slate-600 rounded-md shadow-sm bg-slate-50">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview - Bottom*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 ml-9 flex-shrink-0">
        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Total Crítico
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-red-600 tracking-tight leading-none">{criticalCount}</p>
            <span className="material-symbols-outlined text-red-100 text-3xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Stock Valorizado (USD)
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              ${totalValueUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
            <span className="material-symbols-outlined text-slate-100 text-3xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
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
            Salud de Categoría
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

    </div>
  );
}

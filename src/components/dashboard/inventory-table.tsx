import type { Product, Category } from "@prisma/client";

type ProductWithCategory = Product & { category: Category | null };

interface InventoryTableProps {
  products: ProductWithCategory[];
}

function StockBadge({ current, min }: { current: number; min: number }) {
    if (current <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-red-50 text-red-700 border border-red-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        SIN STOCK
      </span>
    );
  }
  if (current <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        STOCK BAJO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      NORMAL
    </span>
  );
}

export function InventoryTable({ products }: InventoryTableProps) {
    if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <span className="material-symbols-outlined text-4xl text-slate-400">inventory_2</span>
        </div>
        <p className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">Inventario Vacío</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Agrega tu primer producto para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                SKU / Producto
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Categoría
              </th>
              <th className="text-right px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Stock Actual
              </th>
              <th className="text-right px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Precio USD
              </th>
              <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-slate-50/50 transition-colors duration-100 group bg-white"
              >
                <td className="px-5 py-3">
                  <div>
                    <p className="font-bold text-slate-900 border-b border-transparent inline-block">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase mt-0.5">{product.sku}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {product.category ? (
                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {product.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-mono text-slate-900 font-bold">
                    {product.currentStock.toLocaleString("es-VE")}
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest ml-1">uds</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-mono text-emerald-800 font-black">
                    ${product.priceUsd.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <StockBadge current={product.currentStock} min={product.minStock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

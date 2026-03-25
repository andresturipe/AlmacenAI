"use client";

type Product = {
  id: string;
  sku: string;
  name: string;
  priceUsd: number;
  currentStock: number;
  minStock: number;
  categoryId: string | null;
  category?: { id: string; name: string };
};

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
  addToCart: (product: Product) => void;
}

export function ProductCatalog({ products, loading, addToCart }: ProductCatalogProps) {
  return (
    <div className="w-full border border-outline-variant bg-surface-container-lowest flex-1 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-12 bg-surface-container border-b border-outline-variant sticky top-0 z-10">
        <div className="col-span-2 p-2 text-[10px] font-black uppercase text-on-surface-variant border-r border-outline-variant">
          SKU
        </div>
        <div className="col-span-6 p-2 text-[10px] font-black uppercase text-on-surface-variant border-r border-outline-variant">
          Nombre del Producto
        </div>
        <div className="col-span-1 p-2 text-[10px] font-black uppercase text-on-surface-variant border-r border-outline-variant text-center">
          Stock
        </div>
        <div className="col-span-2 p-2 text-[10px] font-black uppercase text-on-surface-variant border-r border-outline-variant text-right">
          Precio USD
        </div>
        <div className="col-span-1 p-2 text-[10px] font-black uppercase text-on-surface-variant text-center">
          Acción
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-outline">Cargando catálogo...</div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-sm text-outline">No hay resultados.</div>
      ) : (
        products.map((product, idx) => {
          const isLow = product.currentStock <= product.minStock;
          const isOutOfStock = product.currentStock === 0;

          return (
            <div
              key={product.id}
              className={`grid grid-cols-12 border-b border-outline-variant hover:bg-emerald-50/30 group transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-surface-container-low"
              }`}
            >
              <div className="col-span-2 p-3 text-xs font-mono border-r border-outline-variant flex items-center">
                {product.sku}
              </div>
              <div className="col-span-6 p-3 text-xs font-bold border-r border-outline-variant flex items-center truncate">
                {product.name}
              </div>
              <div className="col-span-1 p-3 text-xs font-medium border-r border-outline-variant text-center flex flex-col items-center justify-center gap-1">
                <span
                  className={`${
                    isOutOfStock
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : isLow
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  } px-1.5 py-0.5 text-[10px] font-black tracking-widest rounded-md shadow-sm`}
                >
                  {product.currentStock}
                </span>
              </div>
              <div className="col-span-2 p-3 text-xs font-bold border-r border-outline-variant text-right flex items-center justify-end text-emerald-800">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.priceUsd)}
              </div>
              <div className="col-span-1 p-3 text-center flex items-center justify-center">
                <button
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`material-symbols-outlined text-[20px] transition-transform ${
                    isOutOfStock 
                      ? "text-slate-300 cursor-not-allowed" 
                      : "text-emerald-600 hover:scale-110 cursor-pointer"
                  }`}
                >
                  add_box
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

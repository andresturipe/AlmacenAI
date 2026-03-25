"use client";

import { toast } from "sonner";

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

type CartItem = {
  product: Product;
  quantity: number;
};

interface CartSidebarProps {
  cart: CartItem[];
  discountPercentageStr: string;
  setDiscountPercentageStr: (val: string) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  handleProcessSale: () => Promise<void>;
  processing: boolean;
}

export function CartSidebar({
  cart,
  discountPercentageStr,
  setDiscountPercentageStr,
  setCart,
  updateQuantity,
  removeFromCart,
  handleProcessSale,
  processing,
}: CartSidebarProps) {
  const baseSubtotal = cart.reduce(
    (acc, item) => acc + item.product.priceUsd * item.quantity,
    0
  );

  const discountPercentage = parseFloat(discountPercentageStr) || 0;
  const discountAmount = baseSubtotal * (discountPercentage / 100);
  const subtotal = baseSubtotal - discountAmount;
  
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <section className="w-96 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-black uppercase tracking-tighter">
            Resumen de Carrito
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
            CAJA 01
          </span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-[9px] font-black uppercase border border-outline-variant py-1 hover:bg-surface-container transition-colors">
            Cliente: Consumidor Final
          </button>
          <button 
            onClick={() => setCart([])}
            className="flex-1 text-[9px] font-black uppercase border border-outline-variant py-1 hover:bg-surface-container transition-colors text-red-600"
          >
            Limpiar Carro
          </button>
        </div>
      </div>

      {/* Mini Spreadsheet Cart */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-surface-container z-10">
            <tr>
              <th className="p-2 border-b border-outline-variant text-left font-black uppercase text-[9px]">
                Item
              </th>
              <th className="p-2 border-b border-outline-variant text-center font-black uppercase text-[9px]">
                Cant.
              </th>
              <th className="p-2 border-b border-outline-variant text-right font-black uppercase text-[9px]">
                Total
              </th>
              <th className="p-2 border-b border-outline-variant text-center font-black uppercase text-[9px]"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.product.id} className="hover:bg-surface-container-low border-b border-outline-variant">
                <td className="p-2">
                  <div className="font-bold truncate w-40">{item.product.name}</div>
                  <div className="text-[9px] text-outline">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.product.priceUsd)} c/u
                  </div>
                </td>
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center border border-outline-variant bg-white">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 hover:bg-surface-container pb-0.5 text-on-surface"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="w-10 text-center text-[10px] border border-outline-variant bg-white focus:ring-1 focus:ring-emerald-500 py-0.5 font-bold text-on-surface appearance-none"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val > item.product.currentStock) {
                          toast.error(`Stock máximo disponible: ${item.product.currentStock}`);
                          updateQuantity(item.product.id, item.product.currentStock - item.quantity);
                        } else {
                          updateQuantity(item.product.id, val - item.quantity);
                        }
                      }}
                    />
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 hover:bg-surface-container pb-0.5 text-on-surface"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-2 text-right font-bold">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.product.priceUsd * item.quantity)}
                </td>
                <td className="p-2 text-center">
                  <span 
                    onClick={() => removeFromCart(item.product.id)}
                    className="material-symbols-outlined text-[16px] text-red-600 cursor-pointer hover:opacity-70 mt-1"
                  >
                    close
                  </span>
                </td>
              </tr>
            ))}
            {cart.length === 0 && (
              <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-outline italic">Carrito vacío. Agregue productos desde el catálogo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Calculated Totals Panel */}
      <div className="bg-surface-container p-4 border-t border-outline">
        <div className="grid grid-cols-2 gap-y-2 mb-4">
          <div className="text-[10px] font-bold text-outline-variant uppercase flex items-center">
            Descuento (%)
          </div>
          <div className="flex justify-end">
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercentageStr}
              onChange={(e) => setDiscountPercentageStr(e.target.value)}
              className="w-16 text-right bg-white border border-outline-variant focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-700 px-2 py-0.5 rounded-sm outline-none transition-all text-[10px]"
              placeholder="0"
            />
          </div>
          <div className="col-span-2 border-t border-outline-variant my-1"></div>
          <div className="text-[10px] font-bold text-outline-variant uppercase">
            Subtotal Gravable (USD)
          </div>
          <div className="text-[10px] font-bold text-right text-on-surface">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(subtotal)}
          </div>
          <div className="text-[10px] font-bold text-outline-variant uppercase">
            Impuestos (16%)
          </div>
          <div className="text-[10px] font-bold text-right text-on-surface">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(tax)}
          </div>
          <div className="col-span-2 border-t border-outline-variant my-1"></div>
          <div className="text-sm font-black text-on-surface uppercase tracking-tight flex items-center justify-between col-span-2">
            <span>Total USD</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-sm">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
            </span>
          </div>
        </div>

        <button 
          onClick={handleProcessSale}
          disabled={cart.length === 0 || processing}
          className="w-full bg-emerald-600 text-white h-12 text-xs font-black tracking-[0.2em] uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          {processing ? "PROCESANDO..." : "PROCESAR VENTA"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createQuote } from "@/lib/actions/quotes";
import { getProducts } from "@/lib/actions/products";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  sku: string;
  priceUsd: number;
  currentStock: number;
};

type QuoteItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export default function CreateQuoteModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (quote: any) => void; 
}) {
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  async function loadProducts() {
    const res = await getProducts();
    if (res.success) setProducts(res.data as Product[]);
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addItem = (p: Product) => {
    if (items.find(i => i.productId === p.id)) return;
    setItems([...items, { 
      productId: p.id, 
      name: p.name, 
      sku: p.sku, 
      quantity: 1, 
      unitPrice: p.priceUsd 
    }]);
    setSearch("");
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.productId !== id));

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(i => i.productId === id ? { ...i, [field]: value } : i));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    return subtotal * (1 - discountPercent / 100);
  };

  const handleSubmit = async () => {
    if (!clientName) return toast.error("Ingresa el nombre del cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto");

    setIsLoading(true);
    const res = await createQuote({
      clientName,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      discountPercentage: discountPercent,
      validDays: 15
    });

    if (res.success) {
      toast.success("Cotización creada con éxito");
      onSuccess(res.data);
      setItems([]);
      setClientName("");
    } else {
      toast.error(res.error);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-black uppercase tracking-widest text-slate-700 text-sm">Nueva Cotización Formal</h2>
          <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nombre del Cliente</label>
              <input 
                type="text" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="EJ. INVERSIONES SKAIZZ C.A."
                className="w-full border border-slate-200 p-2.5 rounded text-xs font-bold uppercase focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Buscar Productos</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="SKU O NOMBRE..."
                  className="w-full border border-slate-200 pl-8 pr-2.5 py-2.5 rounded text-xs font-bold uppercase focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              {search && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 mt-1 rounded shadow-xl z-20 divide-y divide-slate-50">
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full p-3 text-left hover:bg-emerald-50 flex justify-between items-center transition-colors"
                    >
                      <div>
                        <p className="text-[10px] font-black text-slate-700 uppercase">{p.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 font-mono">{p.sku}</p>
                      </div>
                      <p className="text-xs font-black text-emerald-600">${p.priceUsd}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal</span>
                <span className="text-sm font-black text-slate-700">${items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">Descuento (%)</span>
                <input 
                  type="number" 
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-16 text-right border border-slate-200 p-1 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Cotizado</span>
                <span className="text-xl font-black text-emerald-700">${calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 border border-slate-100 rounded-lg overflow-hidden bg-white shadow-inner min-h-[300px]">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-3 font-black text-slate-400 uppercase tracking-wider">SKU / Item</th>
                  <th className="p-3 font-black text-slate-400 uppercase tracking-wider text-center">Cant.</th>
                  <th className="p-3 font-black text-slate-400 uppercase tracking-wider text-right">Unitario (USD)</th>
                  <th className="p-3 font-black text-slate-400 uppercase tracking-wider text-right">Subtotal</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.productId} className="group hover:bg-slate-50/50">
                    <td className="p-3">
                      <p className="font-black text-slate-700 uppercase">{item.name}</p>
                      <p className="font-bold text-slate-400 font-mono text-[8px]">{item.sku}</p>
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.productId, "quantity", Number(e.target.value))}
                        className="w-16 mx-auto block border border-slate-100 p-1 rounded text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={item.unitPrice}
                        onChange={e => updateItem(item.productId, "unitPrice", Number(e.target.value))}
                        className="w-24 ml-auto block border border-slate-100 p-1 rounded text-right font-bold outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-600"
                      />
                    </td>
                    <td className="p-3 text-right font-black text-slate-700">
                      ${(item.unitPrice * item.quantity).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => removeItem(item.productId)} className="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors">delete</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-300 italic text-xs">
                      Agrega productos desde el panel lateral para armar el presupuesto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-emerald-600 text-white px-8 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50"
          >
            {isLoading ? "GUARDANDO..." : "GENERAR COTIZACION"}
          </button>
        </div>
      </div>
    </div>
  );
}

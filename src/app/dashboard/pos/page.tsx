"use client";

import { useEffect, useState, useTransition } from "react";
import { getProducts } from "@/lib/actions/products";
import { processSale } from "@/lib/actions/pos";
import { toast } from "sonner";
import { CartSidebar } from "@/components/dashboard/CartSidebar";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";

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

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercentageStr, setDiscountPercentageStr] = useState("0");
  const [processing, setProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLoading(true);
      const result = await getProducts();
      if (result.success) {
        setProducts(result.data as Product[]);
      }
      setLoading(false);
    });
  }, []);

  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = activeCategoryId ? p.categoryId === activeCategoryId : true;

    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast.error(`Stock insuficiente para ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
        return prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item;
                if (newQty > item.product.currentStock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        });
    });
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) return;
    
    if (!window.confirm("¿Estás seguro de procesar esta venta?")) {
      return;
    }

    setProcessing(true);

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const result = await processSale({
      organizationId: "", 
      userId: "", 
      items: items,
      discountPercentage: parseFloat(discountPercentageStr) || 0
    });
    
    if (result.success) {
      toast.success(`Venta procesada con éxito. Stock actualizado. FO: ${result.data?.saleId}`);
      setCart([]);
      setDiscountPercentageStr("0");
      
      const refresh = await getProducts();
      if (refresh.success) {
        setProducts(refresh.data as Product[]);
      }
    } else {
      toast.error(`Error: ${result.error || "Stock insuficiente"}`);
    }
    setProcessing(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden font-body text-on-surface bg-gray-50">
      {/* Center: Product Grid */}
      <section className="flex-1 bg-white overflow-y-auto p-4 border-r border-gray-200 flex flex-col">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                Terminal de Ventas
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Catálogo de Disponibilidad
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="BUSCAR PRODUCTOS O SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-8 pr-3 text-[10px] font-bold uppercase placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Navigation Tabs para Categorías */}
          {!loading && categories.length > 0 && (
            <div className="flex bg-white border-b border-gray-200 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`flex-shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 ${
                  activeCategoryId === null
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                Todos los productos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex-shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 ${
                    activeCategoryId === cat.id
                      ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <ProductCatalog 
          products={filtered} 
          loading={loading} 
          addToCart={addToCart} 
        />
      </section>

      <CartSidebar 
        cart={cart}
        discountPercentageStr={discountPercentageStr}
        setDiscountPercentageStr={setDiscountPercentageStr}
        setCart={setCart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        handleProcessSale={handleProcessSale}
        processing={processing}
      />
    </div>
  );
}

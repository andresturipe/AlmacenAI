"use client";

import { useState, useTransition } from "react";
import { processSale } from "@/actions/sales";

// TEMP: demo org/user — replace with session once auth is live
const DEMO_ORG_ID = "demo-org-001";
const DEMO_USER_ID = "demo-admin-001";

interface Product {
  id: string;
  sku: string;
  name: string;
  priceUsd: number;
  currentStock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesClientProps {
  products: Product[];
}

export function SalesClient({ products }: SalesClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function addToCart() {
    if (!selectedProduct || qty <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === selectedProductId);
      if (existing) {
        return prev.map((i) =>
          i.product.id === selectedProductId
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product: selectedProduct, quantity: qty }];
    });
    setSelectedProductId("");
    setQty(1);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  const totalUsd = cart.reduce(
    (acc, i) => acc + i.product.priceUsd * i.quantity,
    0
  );

  function handleCheckout() {
    if (cart.length === 0) return;
    setFeedback(null);

    startTransition(async () => {
      const items = cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        priceAtSale: i.product.priceUsd,
      }));

      const result = await processSale(DEMO_ORG_ID, DEMO_USER_ID, items);

      if (result.success) {
        setCart([]);
        setFeedback({ type: "success", msg: "✅ Venta procesada exitosamente." });
      } else {
        setFeedback({ type: "error", msg: result.error ?? "Error desconocido" });
      }
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Procesar Venta
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Selecciona productos y confirma la transacción de venta.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Product Selector ────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Agregar Producto
            </h2>

            {/* Product select */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Producto
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="">— Seleccionar producto —</option>
                {products
                  .filter((p) => p.currentStock > 0)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.currentStock} disponibles —
                      ${p.priceUsd.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                max={selectedProduct?.currentStock ?? 9999}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>

            {/* Selected product info */}
            {selectedProduct && (
              <div className="rounded-lg bg-blue-600/10 border border-blue-500/20 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-mono text-slate-400">
                      {selectedProduct.sku}
                    </p>
                    <p className="text-sm font-medium text-slate-200">
                      {selectedProduct.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Subtotal</p>
                    <p className="text-sm font-bold text-blue-400">
                      ${(selectedProduct.priceUsd * qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={addToCart}
              disabled={!selectedProductId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_shopping_cart
              </span>
              Agregar al Carrito
            </button>
          </div>
        </div>

        {/* ── Right: Cart ───────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Carrito de Venta
            </h2>

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <span
                  className="material-symbols-outlined text-slate-700 text-[40px] block mb-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shopping_cart
                </span>
                <p className="text-slate-500 text-sm">Carrito vacío</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × ${item.product.priceUsd.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                        ${(item.product.priceUsd * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          close
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Total</span>
              <span className="text-xl font-bold text-white">
                ${totalUsd.toFixed(2)}
              </span>
            </div>

            {/* Checkout */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Confirmar Venta · ${totalUsd.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

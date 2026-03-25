"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createProduct } from "@/lib/actions/products";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function CreateProductModal({ 
  categories = [], 
  defaultCategoryId = "" 
}: { 
  categories?: { id: string; name: string }[];
  defaultCategoryId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [priceUsdStr, setPriceUsdStr] = useState("0");
  const priceUsd = parseFloat(priceUsdStr) || 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const sku = formData.get("sku") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const minStock = parseInt(formData.get("minStock") as string, 10);
    const currentStock = parseInt(formData.get("currentStock") as string, 10);
    const categoryId = formData.get("categoryId") as string;

    // Initial validations
    if (priceUsd <= 0) {
      toast.error("El precio base resultante debe ser mayor a 0.");
      setIsPending(false);
      return;
    }
    if (currentStock < 0 || minStock < 0) {
      toast.error("El stock no puede ser negativo.");
      setIsPending(false);
      return;
    }
    if (!categoryId) {
      toast.error("Debe seleccionar una categoría.");
      setIsPending(false);
      return;
    }

    const result = await createProduct({
      sku,
      name,
      description,
      priceUsd: priceUsd,
      minStock,
      currentStock,
      categoryId,
    });

    setIsPending(false);

    if (result.success) {
      toast.success("Producto creado correctamente.");
      setOpen(false);
    } else {
      toast.error(result.error || "No se pudo crear el producto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-primary text-white text-[10px] font-black tracking-widest uppercase hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm rounded-none">
          <span className="material-symbols-outlined text-sm">add</span>NUEVO
          PRODUCTO
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
          <DialogDescription>
            Ingrese los datos base para registrar el producto en el Ledger maestro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label htmlFor="categoryId" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Categoría *</label>
              <select 
                required 
                id="categoryId" 
                name="categoryId" 
                defaultValue={defaultCategoryId}
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none hover:bg-slate-50 cursor-pointer" 
              >
                <option value="" disabled>Seleccione una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label htmlFor="name" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Nombre del Producto *</label>
              <input 
                required 
                id="name" 
                name="name" 
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant" 
                placeholder="Ej. Disco Duro 1TB" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sku" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Código SKU *</label>
              <input 
                required 
                id="sku" 
                name="sku" 
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-mono focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant uppercase" 
                placeholder="PROD-001" 
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label htmlFor="priceUsd" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Precio Base USD *</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0"
                id="priceUsd" 
                name="priceUsd" 
                value={priceUsdStr}
                onChange={(e) => setPriceUsdStr(e.target.value)}
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-mono text-right focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant" 
                placeholder="0.00" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currentStock" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Stock Inicial *</label>
              <input 
                required 
                type="number" 
                min="0"
                id="currentStock" 
                name="currentStock" 
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-mono text-right focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant" 
                defaultValue="0" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="minStock" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Nivel Mínimo *</label>
              <input 
                required 
                type="number" 
                min="0"
                id="minStock" 
                name="minStock" 
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface font-mono text-right focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant" 
                defaultValue="5" 
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label htmlFor="description" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Descripción</label>
              <textarea 
                id="description" 
                name="description" 
                rows={2}
                className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant resize-none" 
                placeholder="Detalles opcionales..." 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-emerald-600 text-white mt-2 h-10 text-xs font-black tracking-[0.2em] uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-emerald-800"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[16px]">save</span>}
            {isPending ? "GUARDANDO..." : "GUARDAR PRODUCTO"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

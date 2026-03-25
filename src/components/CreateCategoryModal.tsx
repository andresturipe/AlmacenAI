"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCategory } from "@/lib/actions/categories";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function CreateCategoryModal() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const result = await createCategory({ name });

    setIsPending(false);

    if (result.success) {
      toast.success("Categoría creada correctamente.");
      setOpen(false);
    } else {
      toast.error(result.error || "No se pudo crear la categoría.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black tracking-widest uppercase hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm rounded-md">
          <span className="material-symbols-outlined text-sm">create_new_folder</span>
          NUEVA CATEGORÍA
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-emerald-900 font-black uppercase tracking-tight">Nueva Categoría</DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Añade un nuevo folder para organizar tus productos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">Nombre the la Categoría *</label>
            <input 
              required 
              id="name" 
              name="name" 
              className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant" 
              placeholder="Ej. Líquidos, Físicos, Repuestos..." 
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-emerald-600 text-white mt-2 h-10 text-[10px] font-black tracking-[0.2em] uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-emerald-800 rounded-md"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[16px]">save</span>}
            {isPending ? "GUARDANDO..." : "GUARDAR CATEGORÍA"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

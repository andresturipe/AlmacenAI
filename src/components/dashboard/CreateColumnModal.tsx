"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCustomColumn } from "@/lib/actions/columns";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function CreateColumnModal({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as "PERCENTAGE_ADD" | "PERCENTAGE_SUB" | "NUMBER" | "TEXT";

    if (!name.trim()) {
      toast.error("El nombre de la celda es obligatorio.");
      setIsPending(false);
      return;
    }

    const result = await createCustomColumn(name, categoryId, type);
    setIsPending(false);

    if (result.success) {
      toast.success("Columna creada correctamente para esta categoría.");
      setOpen(false);
    } else {
      toast.error(result.error || "Error al crear la columna.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black tracking-widest uppercase hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm rounded-none border border-slate-700">
          <span className="material-symbols-outlined text-[16px]">view_column</span>
          AÑADIR CELDA
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Columna en esta Categoría</DialogTitle>
          <DialogDescription>
            La columna se creará como un cálculo dinámico o texto libre en esta vista únicamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">
              Nombre de Columna *
            </label>
            <input
              required
              id="name"
              name="name"
              className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-outline-variant"
              placeholder="Ej. Precio Vip (%)"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="type" className="text-[10px] font-bold uppercase text-outline-variant tracking-widest">
              Tipo de Dato *
            </label>
            <select
              id="type"
              name="type"
              className="w-full bg-surface border border-outline-variant px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
              defaultValue="PERCENTAGE_ADD"
            >
              <option value="PERCENTAGE_ADD">Porcentaje Suma (+%)</option>
              <option value="PERCENTAGE_SUB">Porcentaje Resta (-%)</option>
              <option value="NUMBER">Número (Cantidades/Fijo)</option>
              <option value="TEXT">Texto Libre (Notas)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 text-white mt-2 h-10 text-xs font-black tracking-[0.2em] uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-emerald-800"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "AGREGAR COLUMNA"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

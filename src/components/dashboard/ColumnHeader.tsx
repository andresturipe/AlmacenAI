"use client";

import { useTransition } from "react";
import { deleteCustomColumn } from "@/lib/actions/columns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ColumnHeader({ col, categoryId }: { col: { id: string, name: string }, categoryId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`¿Estás seguro the querer borrar la columna "${col.name}"? Se perderán todos sus valores en todos los productos th esta categoría.`)) return;

    startTransition(async () => {
      const result = await deleteCustomColumn(col.id, categoryId);
      if (result.success) {
        toast.success("Celda eliminada de esta categoría.");
      } else {
        toast.error(result.error || "Error al eliminar la celda.");
      }
    });
  };

  return (
    <div className="px-3 py-2 border-r border-emerald-100/50 flex justify-end items-center gap-2 group relative">
      <span className="truncate" title={col.name}>{col.name}</span>
      <button 
        onClick={handleDelete}
        disabled={isPending}
        className="text-emerald-900/40 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        title="Eliminar esta columna"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="material-symbols-outlined text-[14px]">delete</span>}
      </button>
    </div>
  );
}

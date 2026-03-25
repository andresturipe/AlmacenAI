"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductColumnValue } from "@/lib/actions/columns";

type CustomColumn = {
  id: string;
  name: string;
  type: string;
};

type ProductColumnValue = {
  id: string;
  columnId: string;
  value: string;
};

type ProductType = {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  priceUsd: number;
  priceLocal: number;
  columnValues: ProductColumnValue[];
};

export function EditableProductRow({ 
  product, 
  columns,
  tasaActual,
  index 
}: { 
  product: ProductType; 
  columns: CustomColumn[];
  tasaActual: number;
  index: number;
}) {
  // Estado local para los valores the las celdas dinámicas
  // Inicializado basado en los valores the BD { [columnId]: value }
  const [cellValues, setCellValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    columns.forEach(col => {
      const existingVal = product.columnValues.find(v => v.columnId === col.id);
      initialValues[col.id] = existingVal ? existingVal.value : "";
    });
    return initialValues;
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleCellChange = (columnId: string, value: string) => {
    setCellValues(prev => ({ ...prev, [columnId]: value }));
  };

  const handleCellBlur = async (columnId: string) => {
    const newVal = cellValues[columnId];
    const oldVal = product.columnValues.find(v => v.columnId === columnId)?.value || "";
    
    // Solo guardar si cambió
    if (newVal === oldVal) return;

    setIsSaving(true);
    const result = await updateProductColumnValue(product.id, columnId, newVal);
    if (!result.success) {
      toast.error(`Error guardando celda: ${result.error}`);
      // Revert in UI (optional)
      // setCellValues(prev => ({ ...prev, [columnId]: oldVal }));
    }
    setIsSaving(false);
  };

  const isCritical = product.currentStock === 0;
  const isLow = product.currentStock < product.minStock;

  let statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  let statusText = "NORMAL";

  if (isCritical) {
    statusColor = "bg-red-50 text-red-700 border border-red-200";
    statusText = "AGOTADO";
  } else if (isLow) {
    statusColor = "bg-amber-50 text-amber-700 border border-amber-200";
    statusText = "BAJO";
  }

  return (
    <div
      className={`grid hover:bg-emerald-50/50 transition-colors border-b border-outline-variant text-[10px] items-center ${
        index % 2 === 0 ? "bg-white" : "bg-slate-50"
      }`}
      style={{ gridTemplateColumns: `120px 1fr 120px ${columns.map(() => '120px').join(' ')} 120px 120px 100px` }}
    >
      <div className="px-3 py-2 border-r border-outline-variant font-mono font-bold tracking-widest text-slate-500 uppercase h-full flex items-center">
        {product.sku}
      </div>
      <div className="px-3 py-2 border-r border-outline-variant font-bold text-slate-900 truncate h-full flex items-center" title={product.name}>
        {product.name}
      </div>
      <div className="px-3 py-2 border-r border-outline-variant text-right flex items-center justify-end h-full">
        <span className={`font-mono font-bold text-xs ${isLow ? "text-error" : "text-slate-900"}`}>
          {product.currentStock}
        </span>
        <span className="text-[9px] text-slate-500 ml-1 font-bold uppercase tracking-widest">uds</span>
      </div>
      
      {/* ── Celdas Dinámicas ── */}
      {columns.map(col => {
        const valStr = cellValues[col.id];
        const pctValue = parseFloat(valStr) || 0;
        
        // Determinar cómo evaluar visualmente la celda
        let computedUsd = 0;
        const isPercentage = col.type.startsWith("PERCENTAGE");
        if (col.type === "PERCENTAGE_ADD") {
          computedUsd = parseFloat((product.priceUsd * (1 + pctValue / 100)).toFixed(2));
        } else if (col.type === "PERCENTAGE_SUB") {
          computedUsd = parseFloat((product.priceUsd * (1 - pctValue / 100)).toFixed(2));
        }

        return (
          <div key={col.id} className="px-2 py-1.5 border-r border-outline-variant text-right h-full flex flex-col justify-center bg-slate-100/30">
            <div className="relative w-full">
              <input
                type={col.type === "TEXT" ? "text" : "number"}
                step={col.type === "TEXT" ? undefined : "0.01"}
                min={col.type === "TEXT" ? undefined : "0"}
                value={valStr}
                onChange={(e) => handleCellChange(col.id, e.target.value)}
                onBlur={() => handleCellBlur(col.id)}
                disabled={isSaving}
                className="w-full text-right bg-transparent border border-transparent hover:border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-700 px-2 py-0.5 rounded-sm outline-none transition-all disabled:opacity-50"
                title={col.name}
              />
              {isPercentage && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[9px] pointer-events-none pr-1">
                  %
                </span>
              )}
            </div>
            {isPercentage && valStr !== "" && (
              <div className="text-[9px] font-black text-emerald-700 tracking-tighter mt-0.5">
                ${computedUsd}
              </div>
            )}
          </div>
        );
      })}

      {/* Columna: Precio USD Base */}
      <div className="px-3 py-2 border-r border-outline-variant text-right font-mono font-black text-slate-800 h-full flex items-center justify-end bg-slate-50/50">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.priceUsd)}
      </div>

      {/* Columna: Precio Local Base */}
      <div className="px-3 py-2 border-r border-outline-variant text-right font-mono font-bold text-slate-600 h-full flex items-center justify-end">
        Bs. {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.priceLocal)}
      </div>

      {/* Columna: Estado */}
      <div className="px-3 py-2 flex justify-center items-center h-full">
        <span className={`${statusColor} px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm whitespace-nowrap`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}

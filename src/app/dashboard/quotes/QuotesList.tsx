"use client";

import { useState } from "react";
import { convertToSale } from "@/lib/actions/quotes";
import { toast } from "sonner";
import CreateQuoteModal from "./CreateQuoteModal";
import QuoteA4View from "./QuoteA4View";

type QuoteItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
    sku: string;
  };
};

type Quote = {
  id: string;
  clientName: string;
  totalUsd: number;
  status: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EXPIRADA";
  discountPercentage: number;
  expiresAt: string;
  createdAt: string;
  items: QuoteItem[];
  user: {
    name: string | null;
  };
};

export default function QuotesList({ 
  initialQuotes,
  organizationName = "VALTEK"
}: { 
  initialQuotes: Quote[],
  organizationName?: string
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isPrintView, setIsPrintView] = useState(false);

  const handleConvert = async (quoteId: string) => {
    if (!confirm("¿Convertir esta cotización en una venta real? Se descontará stock.")) return;

    const result = await convertToSale(quoteId);
    if (result.success) {
      toast.success("Venta procesada con éxito");
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: "APROBADA" } : q));
    } else {
      toast.error((result as any).error || "Error desconocido");
    }
  };

  if (isPrintView && selectedQuote) {
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-auto">
        <div className="print:hidden p-4 bg-slate-100 flex justify-between items-center sticky top-0 border-b border-slate-200">
          <p className="text-xs font-bold uppercase text-slate-500">Vista Previa de Impresión A4</p>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()} 
              className="bg-emerald-600 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              IMPRIMIR / PDF
            </button>
            <button 
              onClick={() => setIsPrintView(false)} 
              className="bg-white border border-slate-300 px-4 py-1.5 rounded text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all"
            >
              CERRAR
            </button>
          </div>
        </div>
        <QuoteA4View quote={selectedQuote} organizationName={organizationName} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva Cotización
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total USD</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vence</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-xs font-bold text-slate-600">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-xs font-bold text-slate-800 uppercase">
                  {quote.clientName}
                </td>
                <td className="p-4 text-xs font-black text-emerald-700">
                  ${quote.totalUsd.toLocaleString()}
                </td>
                <td className="p-4 text-xs text-slate-500">
                  {new Date(quote.expiresAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${
                    quote.status === "PENDIENTE" ? "bg-amber-50 text-amber-600 border-amber-100" :
                    quote.status === "APROBADA" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    "bg-slate-50 text-slate-400 border-slate-200"
                  }`}>
                    {quote.status}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedQuote(quote);
                      setIsPrintView(true);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-all material-symbols-outlined"
                    title="Imprimir PDF A4"
                  >
                    picture_as_pdf
                  </button>
                  {quote.status === "PENDIENTE" && (
                    <button
                      onClick={() => handleConvert(quote.id)}
                      className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 transition-all material-symbols-outlined"
                      title="Convertir a Venta"
                    >
                      shopping_cart_checkout
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 italic text-sm">
                  Crea tu primera cotización para verla aquí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateQuoteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(newQuote) => {
          setQuotes([newQuote, ...quotes]);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

"use client";

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
  status: string;
  discountPercentage: number;
  expiresAt: string;
  createdAt: string;
  items: QuoteItem[];
};

export default function QuoteA4View({ quote, organizationName = "VALTEK" }: { quote: Quote, organizationName?: string }) {
  const subtotal = quote.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const discount = subtotal * (quote.discountPercentage / 100);

  return (
    <div className="print-view-container bg-white w-[210mm] min-h-[297mm] mx-auto p-[20mm] text-slate-800 font-serif leading-relaxed shadow-lg print:shadow-none print:m-0">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black text-emerald-700 uppercase tracking-tighter mb-2">{organizationName}</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Soluciones Industriales y Logísticas</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-300 uppercase mb-1">COTIZACIÓN</h2>
          <p className="text-xs font-bold text-slate-500">Nº {quote.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs font-bold text-slate-500">Fecha: {new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* CLIENT INFO */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h3 className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">INFORMACIÓN DEL CLIENTE</h3>
          <p className="text-sm font-black text-slate-800 uppercase">{quote.clientName}</p>
          <p className="text-xs text-slate-500 mt-1 italic">Presupuesto solicitado vía portal Valtek</p>
        </div>
        <div className="bg-emerald-50/30 p-4 rounded-lg border border-emerald-100/50">
          <h3 className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">VALIDEZ Y ESTADO</h3>
          <p className="text-xs text-slate-700"><strong>Validez:</strong> Vence el {new Date(quote.expiresAt).toLocaleDateString()}</p>
          <p className="text-xs text-slate-700 mt-1"><strong>Estado:</strong> <span className="uppercase font-bold">{quote.status}</span></p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-600 text-white">
              <th className="p-3 text-[10px] font-black uppercase tracking-widest">Descripción / SKU</th>
              <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center">Cant.</th>
              <th className="p-3 text-[10px] font-black uppercase tracking-widest text-right">Unitario (USD)</th>
              <th className="p-3 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td className="p-4">
                  <p className="text-xs font-black text-slate-700 uppercase">{item.product.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 font-mono uppercase">{item.product.sku}</p>
                </td>
                <td className="p-4 text-xs text-center font-bold text-slate-600">{item.quantity}</td>
                <td className="p-4 text-xs text-right font-bold text-slate-600">${item.unitPrice.toLocaleString()}</td>
                <td className="p-4 text-xs text-right font-black text-slate-800">${(item.unitPrice * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS SECTION */}
      <div className="flex justify-end mb-16">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-xs py-1 border-b border-slate-100">
            <span className="font-bold text-slate-400">SUBTOTAL:</span>
            <span className="font-black text-slate-700">${subtotal.toLocaleString()}</span>
          </div>
          {quote.discountPercentage > 0 && (
            <div className="flex justify-between text-xs py-1 border-b border-slate-100 text-emerald-600">
              <span className="font-bold">DESCUENTO ({quote.discountPercentage}%):</span>
              <span className="font-black">-${discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg py-2 bg-slate-50 px-2 rounded font-black text-emerald-700">
            <span>TOTAL USD:</span>
            <span>${quote.totalUsd.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FOOTER / SIGNATURE */}
      <div className="mt-auto border-t border-slate-100 pt-12 grid grid-cols-2 gap-12">
        <div className="text-[10px] text-slate-400 space-y-2 italic">
          <p>* Los precios expresados están sujetos a cambios sin previo aviso.</p>
          <p>* Mercancía viaja por cuenta y riesgo del cliente.</p>
          <p>* Este presupuesto no garantiza reserva de inventario hasta su aprobación y pago.</p>
        </div>
        <div className="flex flex-col items-center justify-end">
          <div className="w-48 border-b border-slate-300 mb-2"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Firma / Sello Autorizado</p>
        </div>
      </div>

      {/* PRINT CSS OVERRIDE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { 
            visibility: hidden; 
            background: white !important; 
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-view-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Hide everything else */
          main, header, nav, footer, aside { display: none !important; }
        }
      `}} />
    </div>
  );
}

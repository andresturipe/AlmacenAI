"use client";

import { useState } from "react";
import type { Sale, SaleItem, Product } from "@prisma/client";

type PopulatedSaleItem = SaleItem & { product: Product };
type PopulatedSale = Sale & { 
  items: PopulatedSaleItem[]; 
  user: { name: string | null; email: string };
  discountPercentage: number; // Forzar inclusión por si Prisma local está desincronizado
};

export default function SalesHistoryClient({ 
  initialSales,
  organizationName = "Comprobante de Venta"
}: { 
  initialSales: PopulatedSale[],
  organizationName?: string
}) {
  const [selectedSale, setSelectedSale] = useState<PopulatedSale | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-hidden font-body text-on-surface bg-surface flex flex-col pt-4">
      
      {/* --- VISTA DE PANTALLA (NO IMPRIMIBLE) --- */}
      <div className="print:hidden p-6 flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">
              Historial de Ventas
            </h2>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
              Registro Oficial the Transacciones
            </p>
          </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-outline-variant overflow-y-auto custom-scrollbar shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-container sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b border-outline-variant font-black uppercase tracking-wider text-on-surface-variant text-[10px]">
                  Fecha y Hora
                </th>
                <th className="p-3 border-b border-outline-variant font-black uppercase tracking-wider text-on-surface-variant text-[10px]">
                  Nº Ticket
                </th>
                <th className="p-3 border-b border-outline-variant font-black uppercase tracking-wider text-on-surface-variant text-[10px] text-center">
                  Items
                </th>
                <th className="p-3 border-b border-outline-variant font-black uppercase tracking-wider text-on-surface-variant text-[10px] text-right">
                  Descuento
                </th>
                <th className="p-3 border-b border-outline-variant font-black uppercase tracking-wider text-on-surface-variant text-[10px] text-right">
                  Total Final
                </th>
              </tr>
            </thead>
            <tbody>
              {initialSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-outline text-sm">
                    No hay ventas registradas aún.
                  </td>
                </tr>
              ) : (
                initialSales.map((sale, idx) => (
                  <tr 
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className={`cursor-pointer transition-colors border-b border-outline-variant hover:bg-emerald-50/50 group ${
                      idx % 2 === 0 ? "bg-white" : "bg-surface-container-low"
                    }`}
                  >
                    <td className="p-3 font-medium text-slate-600">
                      {new Date(sale.createdAt).toLocaleString("es-VE", {
                        dateStyle: "medium", timeStyle: "short"
                      })}
                    </td>
                    <td className="p-3 font-mono text-[10px] font-bold text-slate-500">
                      #{sale.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-600">
                      {sale.discountPercentage > 0 ? `${sale.discountPercentage}%` : "-"}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(sale.totalUsd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DETALLE EN PANTALLA (NO IMPRIMIBLE) --- */}
      {selectedSale && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-black uppercase tracking-wider text-slate-800">
                {organizationName} - Venta #{selectedSale.id.slice(-8).toUpperCase()}
              </h3>
              <button 
                onClick={() => setSelectedSale(null)}
                className="material-symbols-outlined text-slate-400 hover:text-slate-700 transition-colors"
              >
                close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-sm bg-white">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Fecha</p>
                  <p className="font-semibold text-slate-700">
                    {new Date(selectedSale.createdAt).toLocaleString("es-VE")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Vendedor</p>
                  <p className="font-semibold text-slate-700">{selectedSale.user?.name || selectedSale.user?.email || "N/A"}</p>
                </div>
              </div>

              <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-200 pb-2 flex justify-between">
                <span>Producto</span>
                <span>Subtotal</span>
              </div>
              
              <div className="space-y-3 mb-6">
                {selectedSale.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.product.name}</p>
                      <p className="text-slate-500">{item.quantity} x {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.priceAtSale)}</p>
                    </div>
                    <div className="font-bold text-slate-800">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.quantity * item.priceAtSale)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                {selectedSale.discountPercentage > 0 && (
                  <div className="flex justify-between items-center text-amber-600 font-bold">
                    <span>Descuento aplicado:</span>
                    <span>{selectedSale.discountPercentage}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black text-emerald-700 uppercase pt-2">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(selectedSale.totalUsd)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-bold uppercase tracking-widest text-xs transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TICKET EXCLUSIVO PARA IMPRESIÓN --- */}
      {selectedSale && (
        <div className="hidden print:block w-[80mm] font-mono text-black p-4 text-xs mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-lg font-black uppercase tracking-widest">{organizationName}</h1>
            <p className="text-[10px]">Comprobante de Venta</p>
            <p className="text-[10px] mt-2">--------------------------------</p>
          </div>

          <div className="mb-4 text-[10px]">
            <p><strong>TICKET:</strong> #{selectedSale.id.slice(-8).toUpperCase()}</p>
            <p><strong>FECHA:</strong> {new Date(selectedSale.createdAt).toLocaleDateString("es-VE")}</p>
            <p><strong>HORA:</strong> {new Date(selectedSale.createdAt).toLocaleTimeString("es-VE", { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>CAJERO:</strong> {selectedSale.user?.name?.split(" ")[0] || "CAJA_01"}</p>
          </div>

          <div className="text-[10px] mb-2 uppercase">
            <div className="flex justify-between border-b border-black pb-1 mb-1 font-bold">
              <span className="w-8">CANT</span>
              <span className="flex-1">DESCRIPCION</span>
              <span className="w-16 text-right">TOTAL</span>
            </div>
            
            {selectedSale.items.map(item => (
              <div key={item.id} className="flex justify-between mb-1 items-start">
                <span className="w-8 font-bold">{item.quantity}</span>
                <span className="flex-1 pr-2 truncate">
                  {item.product.name.slice(0, 15)}
                  <br />
                  <span className="text-[9px]">${item.priceAtSale.toFixed(2)} c/u</span>
                </span>
                <span className="w-16 text-right font-bold">${(item.quantity * item.priceAtSale).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center mb-2">--------------------------------</p>

          <div className="text-[10px] space-y-1">
            <div className="flex justify-between font-bold">
              <span>SUBTOTAL:</span>
              <span>
                ${(selectedSale.items.reduce((acc, i) => acc + (i.quantity * i.priceAtSale), 0)).toFixed(2)}
              </span>
            </div>
            
            {selectedSale.discountPercentage > 0 && (
              <div className="flex justify-between font-bold">
                <span>DESC ({selectedSale.discountPercentage}%):</span>
                <span>
                  -${(selectedSale.items.reduce((acc, i) => acc + (i.quantity * i.priceAtSale), 0) * (selectedSale.discountPercentage / 100)).toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-base font-black uppercase mt-2 pt-2 border-t border-black">
              <span>TOTAL USD:</span>
              <span>${selectedSale.totalUsd.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-[10px] text-center mt-6">--------------------------------</p>
          <p className="text-center font-bold text-[10px] mt-2 uppercase">¡Gracias por su compra!</p>
          <p className="text-center text-[8px] mt-1">Este documento interno no posee</p>
          <p className="text-center text-[8px]">validez fiscal como factura.</p>
        </div>
      )}
      
      {/* GLOBAL PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          title { display: none; }
          @page { margin: 0; size: 80mm auto; }
          body { 
            visibility: hidden; 
            background: white !important; 
            margin: 0; 
            padding: 0;
          }
          .print\\:block { 
            visibility: visible; 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
          }
        }
      `}} />
    </div>
  );
}

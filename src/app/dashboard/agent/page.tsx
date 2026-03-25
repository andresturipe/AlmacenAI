import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agente IA" };

export default function AgentPage() {
  return (
    <div className="p-6 h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Agente IA
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inteligencia artificial integrada para gestión de almacén.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/60 to-indigo-950/20 backdrop-blur-sm overflow-hidden flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-indigo-500/15">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span
              className="material-symbols-outlined text-white text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Valtek AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-emerald-400">En línea</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 font-medium">
              GPT-4o
            </span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* AI intro message */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span
                className="material-symbols-outlined text-indigo-400 text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                smart_toy
              </span>
            </div>
            <div className="rounded-xl rounded-tl-sm bg-slate-800/70 border border-slate-700/50 px-4 py-3 max-w-lg">
              <p className="text-slate-300 text-sm leading-relaxed">
                ¡Hola! Soy el Agente IA de Valtek. Puedo ayudarte a:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                  Analizar niveles de stock y predecir la demanda
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                  Sugerir reabastecimiento óptimo por categoría
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                  Detectar anomalías en los movimientos de inventario
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                  Generar reportes y resúmenes ejecutivos
                </li>
              </ul>
              <p className="text-slate-500 text-xs mt-2">
                ¿En qué te puedo ayudar hoy?
              </p>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 pl-10">
            {[
              "¿Qué productos tienen stock crítico?",
              "Reporte de ventas de hoy",
              "Optimizar reabastecimiento",
              "Análisis de movimientos",
            ].map((s) => (
              <button
                key={s}
                className="px-3 py-1.5 text-xs rounded-full border border-indigo-500/25 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:border-indigo-400/40 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 focus-within:border-indigo-500/50 transition-colors">
            <input
              type="text"
              placeholder="Escribe tu consulta al agente IA..."
              className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
            />
            <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors">
              <span className="material-symbols-outlined text-white text-[18px]">
                send
              </span>
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">
            Integración completa disponible con Vercel AI SDK + OpenAI
          </p>
        </div>
      </div>
    </div>
  );
}

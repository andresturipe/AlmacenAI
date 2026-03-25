// KPI stat cards for the Valtek dashboard

interface Stats {
  totalValueUsd: number;
  lowStockCount: number;
  todayLogs: number;
  salesTodayUsd?: number;
}

interface KpiCardsProps {
  stats: Stats;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const kpis = [
    {
      label: "Stock Valorizado",
      value: `$${stats.totalValueUsd.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "inventory_2",
      gradient: "from-sky-50 to-white",
      border: "border-sky-100",
      iconColor: "text-sky-700",
      iconBg: "bg-sky-100",
      description: "Valor total en USD",
    },
    {
      label: "Alertas de Stock",
      value: stats.lowStockCount.toLocaleString("es-VE"),
      icon: "warning",
      gradient:
        stats.lowStockCount > 0
          ? "from-red-50 to-white"
          : "from-emerald-50 to-white",
      border:
        stats.lowStockCount > 0
          ? "border-red-100"
          : "border-emerald-100",
      iconColor:
        stats.lowStockCount > 0 ? "text-red-700" : "text-emerald-700",
      iconBg:
        stats.lowStockCount > 0 ? "bg-red-100" : "bg-emerald-100",
      description:
        stats.lowStockCount > 0 ? "Requieren atención urgente" : "Todo en orden",
    },
    {
      label: "Movimientos Hoy",
      value: stats.todayLogs.toLocaleString("es-VE"),
      icon: "swap_vert",
      gradient: "from-indigo-50 to-white",
      border: "border-indigo-100",
      iconColor: "text-indigo-700",
      iconBg: "bg-indigo-100",
      description: "Entradas, salidas y ventas",
    },
    {
      label: "Ventas del Día",
      value: `$${(stats.salesTodayUsd ?? 0).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: "payments",
      gradient: "from-emerald-50 to-white",
      border: "border-emerald-100",
      iconColor: "text-emerald-700",
      iconBg: "bg-emerald-100",
      description: "Ingresos en USD",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`relative overflow-hidden rounded-xl border ${kpi.border} bg-gradient-to-br ${kpi.gradient} p-5 transition-all duration-200 hover:shadow-md group`}
        >
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                {kpi.label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${kpi.iconColor}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {kpi.icon}
                </span>
              </div>
            </div>
            <p className={`text-3xl font-black ${kpi.iconColor} mb-1 tracking-tight`}>
              {kpi.value}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

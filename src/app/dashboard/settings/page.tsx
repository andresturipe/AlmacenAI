import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Configuración" };

const DEMO_ORG_ID = "demo-org-001";

async function getOrgData() {
  return prisma.organization.findUnique({
    where: { id: DEMO_ORG_ID },
    include: {
      _count: { select: { users: true, products: true } },
    },
  });
}

export default async function SettingsPage() {
  const org = await getOrgData();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configuración
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gestión de organización, usuarios y preferencias del sistema.
        </p>
      </div>

      {/* Org Card */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Organización
        </h2>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <span className="text-white text-2xl font-extrabold tracking-tight">
              V
            </span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {org?.name ?? "Valtek Demo"}
            </p>
            <p className="text-slate-500 text-sm font-mono">
              slug: {org?.slug ?? "valtek-demo"}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          {[
            { label: "ID de Organización", value: org?.id ?? "—", mono: true },
            { label: "Fecha de Creación", value: org?.createdAt?.toLocaleDateString("es-VE") ?? "—" },
            { label: "Usuarios Activos", value: org?._count.users.toString() ?? "0" },
            { label: "Productos Registrados", value: org?._count.products.toString() ?? "0" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-800/50 px-4 py-3 border border-slate-700/40">
              <dt className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</dt>
              <dd className={`mt-1 text-sm font-medium text-slate-200 ${item.mono ? "font-mono text-xs" : ""}`}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Integrations */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Integraciones
        </h2>

        {[
          {
            name: "Inngest",
            description: "Automatización de tareas y cron jobs",
            icon: "schedule",
            status: "Activo",
            statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          },
          {
            name: "Open Exchange Rates",
            description: "Actualización automática de tasas de cambio",
            icon: "currency_exchange",
            status: "Requiere API Key",
            statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          },
          {
            name: "OpenAI (Agente IA)",
            description: "Análisis inteligente y predicciones de inventario",
            icon: "smart_toy",
            status: "Requiere Configuración",
            statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          },
        ].map((integration) => (
          <div
            key={integration.name}
            className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/40"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">
                {integration.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">{integration.name}</p>
              <p className="text-xs text-slate-500">{integration.description}</p>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${integration.statusColor}`}
            >
              {integration.status}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

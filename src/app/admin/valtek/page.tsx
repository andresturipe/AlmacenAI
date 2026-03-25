import { createClerkClient } from "@clerk/nextjs/server";
import { SubscriptionSwitch } from "@/components/admin/SubscriptionSwitch";
import { Users, Building2, ShieldCheck, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default async function ValtekAdminPage() {
  const response = await clerkClient.organizations.getOrganizationList({
    limit: 100,
    includeMembersCount: true,
  });

  const organizations = response.data;
  const activeCount = organizations.filter(
    (org) => (org.publicMetadata?.subscriptionStatus as string) !== "inactive"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Total Clientes</p>
              <h3 className="text-2xl font-bold">{organizations.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Activos</p>
              <h3 className="text-2xl font-bold">{activeCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-500/10 rounded-xl text-zinc-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Super Admin</p>
              <h3 className="text-base font-semibold">Andres Turipe</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Gestión de Organizaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Organización / Cliente</th>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold text-center">Miembros</th>
                <th className="px-6 py-4 font-semibold text-right">Suscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {organizations.map((org) => {
                const status = (org.publicMetadata?.subscriptionStatus as string) || "active";
                const isActive = status === "active";

                return (
                  <tr key={org.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                          {org.imageUrl ? (
                            <img src={org.imageUrl} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={18} className="text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100">{org.name}</div>
                          <div className="text-xs text-zinc-500">{org.slug || "Sin slug"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-400 font-mono group-hover:bg-zinc-800 transition-colors">
                        {org.id}
                      </code>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs">
                        <Users size={12} />
                        {org.membersCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`text-xs font-medium ${isActive ? "text-emerald-500" : "text-zinc-500"}`}>
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                        <SubscriptionSwitch 
                          organizationId={org.id} 
                          initialStatus={status} 
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {organizations.length === 0 && (
          <div className="p-20 text-center text-zinc-500">
             No hay organizaciones registradas.
          </div>
        )}
      </div>
    </div>
  );
}

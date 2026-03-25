import { Metadata } from "next";
import { getQuotes } from "@/lib/actions/quotes";
import QuotesList from "./QuotesList";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Cotizaciones | Valtek",
};

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const { orgId } = await auth();
  let orgName = "Presupuesto Formal";

  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      orgName = org.name;
    } catch (e) {
      console.error("Error fetching org name:", e);
    }
  }

  const result = await getQuotes();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Gestión de Cotizaciones
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Presupuestos y Propuestas Formales (Formato A4)
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <QuotesList 
          initialQuotes={result.success ? JSON.parse(JSON.stringify(result.data)) : []} 
          organizationName={orgName}
        />
      </div>
    </div>
  );
}

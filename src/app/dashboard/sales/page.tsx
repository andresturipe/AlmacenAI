import { Metadata } from "next";
import { getSales } from "@/lib/actions/pos";
import SalesHistoryClient from "./SalesHistoryClient";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const metadata: Metadata = { title: "Historial de Ventas" };
export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const { orgId } = await auth();
  let orgName = "Comprobante de Venta";

  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      orgName = org.name;
    } catch (e) {
      console.error("Error fetching org name:", e);
    }
  }

  const result = await getSales(100);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center bg-surface flex-1">
        <h2 className="text-xl font-bold text-error">Error cargando historial</h2>
        <p className="text-on-surface-variant mt-2">{result.error}</p>
      </div>
    );
  }

  const serializedSales = JSON.parse(JSON.stringify(result.data));

  return (
    <SalesHistoryClient initialSales={serializedSales} organizationName={orgName} />
  );
}

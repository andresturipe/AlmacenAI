import { OrganizationList } from "@clerk/nextjs";

export default function OrgSelectionPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface w-full h-full p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black uppercase text-on-surface tracking-tighter">
          Bienvenido a Valtek Enterprise
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-outline mt-2">
          Por favor, selecciona o crea tu organización para continuar
        </p>
      </div>
      
      <OrganizationList 
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            cardBox: "border border-outline-variant shadow-none rounded-none",
            headerTitle: "font-black uppercase tracking-tight text-on-surface text-lg",
            headerSubtitle: "text-xs font-bold uppercase text-outline",
            organizationListPreviewButton: "rounded-none hover:bg-emerald-50 transition-colors",
            organizationListCreateOrganizationActionButton: "rounded-none text-primary hover:text-emerald-700",
            buttonPrimary: "bg-primary rounded-none font-bold uppercase hover:bg-emerald-700"
          }
        }}
      />
    </div>
  );
}

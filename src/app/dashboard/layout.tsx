"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Show, SignInButton, UserButton, OrganizationSwitcher, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { migrateDemoDataToUser } from "@/lib/actions/setup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isSuperAdmin = userEmail === "tu-email@ejemplo.com" || userEmail === "admin@valtek.com";

  // Debug de OrgId solicitado por el usuario
  const authOrgId = user?.organizationMemberships?.[0]?.organization?.id || null;
  console.log("=========================================");
  console.log("🚀 DEBUG CLERK - USER:", userEmail);
  console.log("🏢 DEBUG CLERK - ORG ID ACTIVO:", authOrgId);
  console.log("=========================================");

  const navItems = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/dashboard/inventory", icon: "inventory_2", label: "Inventario" },
    { href: "/dashboard/pos", icon: "point_of_sale", label: "Punto de Venta" },
    { href: "/dashboard/sales", icon: "receipt_long", label: "Historial Ventas" },
    { href: "/dashboard/quotes", icon: "request_quote", label: "Cotizaciones" },
    { href: "/dashboard/agent", icon: "smart_toy", label: "Agente IA" },
    { href: "/dashboard/settings", icon: "settings", label: "Configuración" },
  ];

  return (
    <div className="flex min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full flex flex-col w-64 bg-emerald-600 border-r border-emerald-700 shadow-xl z-50">
        <div className="p-6">
          <div className="mb-8">
            <OrganizationSwitcher
              hidePersonal={false}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full rounded-lg hover:bg-emerald-500 transition-colors flex justify-between px-3 py-2 border border-emerald-500 bg-emerald-600 shadow-sm",
                  organizationPreviewTextContainer: "text-left",
                  organizationPreviewMainIdentifier: "text-sm font-black text-white",
                  organizationPreviewSecondaryIdentifier: "text-[10px] font-bold text-emerald-200 uppercase tracking-widest",
                  organizationSwitcherTriggerIcon: "text-white",
                }
              }}
            />
          </div>

          <nav className="space-y-1 font-inter text-sm antialiased font-medium">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "flex items-center gap-3 px-4 py-2 text-white bg-emerald-700 border-r-4 border-white font-black transition-all duration-100 shadow-inner rounded-l-md tracking-wider uppercase"
                      : "flex items-center gap-3 px-4 py-2 text-emerald-100 hover:text-white hover:bg-emerald-500 transition-colors duration-150 rounded-l-md font-bold tracking-wider uppercase"
                  }
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-emerald-500">
          <div className="p-2">
            <Show when="signed-out">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-[10px] uppercase tracking-widest text-emerald-100 text-center mb-1">ACCESO RESTRINGIDO</p>
                <SignInButton mode="modal">
                  <button className="w-full py-2 rounded-md bg-white text-emerald-800 text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors shadow-sm">
                    INICIAR SESIÓN
                  </button>
                </SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center w-full bg-emerald-700 p-2.5 rounded-xl border border-emerald-500 shadow-inner">
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      userButtonTrigger: "w-full hover:bg-transparent px-0 focus:shadow-none shadow-none",
                      userButtonAvatarBox: "w-8 h-8 rounded-full border border-emerald-300",
                      userButtonOuterIdentifier: "text-xs font-black text-white ml-3 truncate uppercase tracking-widest",
                    }
                  }}
                />
              </div>
            </Show>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col bg-slate-50">
        {/* Top Navigation Bar */}
        <header className="flex justify-between items-center h-14 px-6 w-full sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="bg-slate-100 border-none text-[10px] font-bold text-slate-700 tracking-widest pl-10 pr-4 py-2 w-64 focus:ring-1 focus:ring-emerald-500 transition-all uppercase rounded-md placeholder:text-slate-400"
                placeholder="BUSCAR EN EL LEDGER..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-emerald-700 transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <button className="text-slate-500 hover:text-emerald-700 transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
            <button className="bg-emerald-600 text-white rounded-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm">
              <span className="material-symbols-outlined text-xs">add</span>
              NUEVA ENTRADA
            </button>
          </div>
        </header>

        {/* Dynamic Canvas Area */}
        <div className="flex-1 flex flex-col relative z-0">
          {children}
        </div>

        <Toaster position="top-right" richColors />

        {/* System Footer Metadata */}
        <footer className="mt-auto border-t border-outline-variant py-3 px-6 bg-white flex justify-center items-center">
          <span className="text-[9px] font-bold uppercase text-outline tracking-widest">
            Versión Sistema: 4.2.0-STABLE
          </span>
        </footer>
      </main>
    </div>
  );
}

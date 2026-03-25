import { ShieldAlert, Mail } from "lucide-react";
import Link from "next/link";

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="max-w-md w-full bg-[#111] border border-zinc-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 text-red-500 mb-8 border border-red-500/20">
            <ShieldAlert size={40} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">
            Suscripción Vencida
          </h1>
          
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            Tu acceso a la plataforma ha sido suspendido temporalmente por falta de pago o vencimiento de plan.
          </p>

          <div className="space-y-4">
            <a 
              href="mailto:soporte@valtek.com" 
              className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-100 text-black font-bold rounded-2xl hover:bg-white transition-all transform active:scale-[0.98]"
            >
              <Mail size={18} />
              Contactar Soporte
            </a>
            
            <Link 
              href="/" 
              className="block w-full py-4 text-zinc-500 font-medium hover:text-zinc-300 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 text-zinc-600 text-sm">
          Valtek SaaS Control &copy; 2026
        </div>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function LoadingSales() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          Iniciando Terminal POS...
        </p>
      </div>
    </div>
  );
}

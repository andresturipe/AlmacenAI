import { Loader2 } from "lucide-react";

export default function LoadingInventory() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="flex flex-col items-center gap-4 text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-outline">
          Conectando con DB...
        </p>
      </div>
    </div>
  );
}

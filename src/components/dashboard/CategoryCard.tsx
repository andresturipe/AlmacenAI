"use client";

import { Folder } from "lucide-react";
import Link from "next/link";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    _count: {
      products: number;
    };
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link 
      href={`/dashboard/inventory/${category.id}`} 
      className="group relative bg-white border border-slate-200 rounded-md p-5 flex flex-col hover:border-emerald-500 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 transition-colors">
          <Folder className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" strokeWidth={1.5} />
        </div>
        <div className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">
          {category._count.products} ITEMS
        </div>
      </div>
      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-1">
        {category.name}
      </h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-emerald-600/70 transition-colors flex items-center gap-1">
        Ver Contenido
        <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
      </p>
    </Link>
  );
}

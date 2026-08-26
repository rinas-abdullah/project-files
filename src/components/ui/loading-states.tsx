import React from "react";
import { Loader2 } from "lucide-react";
import { GlassCard } from "./glass";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={`w-6 h-6 animate-spin text-[#0B4D8D] ${className}`} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Spinner className="w-10 h-10" />
      <p className="text-sm font-bold text-slate-500">جاري تحميل البيانات...</p>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string, description: string, icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      {Icon && <Icon className="w-12 h-12 text-slate-300 mb-4" />}
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}

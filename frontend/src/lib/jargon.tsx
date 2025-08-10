import React from "react";
import { TOOLTIPS } from "../content/microcopy";

export const Jargon = ({ 
  term, 
  children 
}: { 
  term: keyof typeof TOOLTIPS; 
  children?: React.ReactNode 
}) => (
  <span 
    className="underline decoration-dotted cursor-help" 
    aria-label={TOOLTIPS[term]} 
    title={TOOLTIPS[term]}
  >
    {children ?? String(term)}
  </span>
);

export const Badge = ({ 
  label, 
  tone = "slate" 
}: { 
  label: string; 
  tone?: "green" | "amber" | "slate" 
}) => (
  <span 
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border bg-white ${
      tone === "green" 
        ? "border-emerald-200 text-emerald-700" 
        : tone === "amber" 
        ? "border-amber-200 text-amber-700" 
        : "border-slate-200 text-slate-600"
    }`}
  >
    {label}
  </span>
);

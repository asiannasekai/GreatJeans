"use client";

import React from "react";
import { useAppStore } from "../lib/store";

export function ViewModeToggle({ className = "" }: { className?: string }) {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <div className={`inline-flex rounded-lg border border-slate-200 bg-white p-1 ${className}`}>
      <button
        onClick={() => setViewMode("simple")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === "simple"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Simple
      </button>
      <button
        onClick={() => setViewMode("expert")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === "expert"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Expert
      </button>
    </div>
  );
}

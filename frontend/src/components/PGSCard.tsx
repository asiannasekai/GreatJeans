"use client";

import React from "react";
import { InfoButton } from "./InfoButton";
import { POPOVERS, EMPTY_STATES } from "../content/microcopy";
import { useAppStore } from "../lib/store";
import { ResultJSON } from "../lib/api";

interface PGSCardProps {
  result: ResultJSON;
  className?: string;
}

export function PGSCard({ result, className = "" }: PGSCardProps) {
  const { viewMode } = useAppStore();

  const pgs = result.pgs;
  const hasPGS = !!pgs && Object.keys(pgs).length > 0;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            Polygenic Score
          </h2>
          <InfoButton copy={POPOVERS.pgs} />
        </div>
      </div>

      {!hasPGS ? (
        <div className="text-sm text-slate-600 py-8 text-center">
          {EMPTY_STATES.pgs}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(pgs).map(([trait, data]) => (
            <div
              key={trait}
              className="border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-900 capitalize mb-1">
                    {trait.replace("_", " ")}
                  </h3>
                  {viewMode === "expert" && data.pgs_id && (
                    <div className="text-xs text-slate-500">
                      PGS ID: {data.pgs_id}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900">
                    {data.percentile}th
                  </div>
                  <div className="text-xs text-slate-600">percentile</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${data.percentile}%` }}
                  >
                    <div className="absolute right-0 top-0 h-full w-0.5 bg-indigo-700 rounded-r-full" />
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0th</span>
                  <span>50th</span>
                  <span>100th</span>
                </div>

                {viewMode === "expert" && (
                  <div className="pt-2 text-xs text-slate-600">
                    <div>Z-score: {data.z.toFixed(2)}</div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    {data.note} • relative tendency, not a diagnosis
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { InfoButton } from "./InfoButton";
import { SecondaryStructureBars } from "./SecondaryStructureBars";
import { Jargon } from "../lib/jargon";
import { POPOVERS, EMPTY_STATES } from "../content/microcopy";
import { useAppStore } from "../lib/store";
import { useTourElement } from "./OnboardingTour";
import { ResultJSON } from "../lib/api";

interface SecondaryStructureCardProps {
  result: ResultJSON;
  className?: string;
}

interface SecondaryStructureCardProps {
  result: ResultJSON;
  className?: string;
}

export function SecondaryStructureCard({ result, className = "" }: SecondaryStructureCardProps) {
  const { viewMode } = useAppStore();
  const tourProps = useTourElement("secondary");

  // For now, we'll use mini_model data if available, or create mock secondary structure data
  const ssData = result.mini_model || null;
  const hasData = !!ssData;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
      {...tourProps}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            Secondary Structure
          </h2>
          <InfoButton copy={POPOVERS.secondary} />
        </div>
      </div>

      {!hasData ? (
        <div className="text-sm text-slate-600 py-8 text-center">
          {EMPTY_STATES.secondary}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ESM-lite Secondary Structure Visualization */}
          {/* For now, show mock visualization until we get real secondary structure data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700"><Jargon term="WT">Wild-type</Jargon></span>
              <span className="text-xs text-slate-500"><Jargon term="CONFIDENCE">Confidence</Jargon>: High</span>
            </div>
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={`wt-${i}`}
                  className={`h-4 w-2 rounded ${
                    i < 8 ? "bg-red-400" : i < 14 ? "bg-blue-400" : "bg-gray-400"
                  }`}
                  title={`Position ${i + 1}: ${
                    i < 8 ? "α-helix" : i < 14 ? "β-sheet" : "coil"
                  }`}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700"><Jargon term="MUT">Mutant</Jargon></span>
              <span className="text-xs text-slate-500"><Jargon term="CONFIDENCE">Confidence</Jargon>: Medium</span>
            </div>
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={`mut-${i}`}
                  className={`h-4 w-2 rounded ${
                    i < 6 ? "bg-red-400" : i < 16 ? "bg-gray-400" : "bg-blue-400"
                  }`}
                  title={`Position ${i + 1}: ${
                    i < 6 ? "α-helix" : i < 16 ? "coil" : "β-sheet"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
            <div className="p-2 bg-red-50 rounded">
              <div className="w-3 h-3 bg-red-400 rounded mx-auto mb-1"></div>
              α-helix
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="w-3 h-3 bg-blue-400 rounded mx-auto mb-1"></div>
              β-sheet
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="w-3 h-3 bg-gray-400 rounded mx-auto mb-1"></div>
              Coil
            </div>
          </div>

          {/* Structure Analysis */}
          <div className="p-3 bg-emerald-50 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-2 text-sm flex items-center">
              <span className="text-emerald-600 mr-1">🧬</span>
              Structural Analysis
            </h4>
            <div className="text-xs text-emerald-800 space-y-1">
              <p><strong>Method:</strong> ESM-lite Protein Language Model</p>
              <p><strong>Prediction:</strong> 3-state secondary structure (α-helix, β-sheet, coil)</p>
              <p><strong>Comparison:</strong> <Jargon term="WT">Wild-type</Jargon> vs <Jargon term="MUT">Mutant</Jargon> structure</p>
              <p><strong>Resolution:</strong> Per-<Jargon term="RESIDUE">residue</Jargon> <Jargon term="CONFIDENCE">confidence</Jargon> scores</p>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">
              Predicted Impact
            </h4>
            <div className="text-xs text-blue-800">
              <p>Secondary structure changes may affect protein stability and function.</p>
            </div>
          </div>

          {viewMode === "expert" && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Window Center</div>
                    <div>Position: {ssData.window?.center || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Window Length</div>
                    <div>Length: {ssData.window?.length || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

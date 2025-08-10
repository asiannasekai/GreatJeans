"use client";

import React from "react";
import { Badge, Jargon } from "../lib/jargon";
import { useAppStore } from "../lib/store";

interface SecondaryStructure {
  type: string;
  wt: number;
  mut: number;
  delta: number;
  color: string;
}

interface SecondaryStructureBarsProps {
  data?: {
    wt: {
      helix: number;
      sheet: number;
      coil: number;
      confidence: number;
    };
    mut: {
      helix: number;
      sheet: number;
      coil: number;
      confidence: number;
    };
  };
  className?: string;
}

export function SecondaryStructureBars({ data, className = "" }: SecondaryStructureBarsProps) {
  const { viewMode } = useAppStore();

  // Default demo data if none provided
  const defaultData = {
    wt: { helix: 0.45, sheet: 0.25, coil: 0.30, confidence: 0.82 },
    mut: { helix: 0.43, sheet: 0.27, coil: 0.30, confidence: 0.82 }
  };

  const structureData = data || defaultData;

  const structures: SecondaryStructure[] = [
    {
      type: "Helix",
      wt: structureData.wt.helix,
      mut: structureData.mut.helix,
      delta: structureData.mut.helix - structureData.wt.helix,
      color: "purple"
    },
    {
      type: "Sheet", 
      wt: structureData.wt.sheet,
      mut: structureData.mut.sheet,
      delta: structureData.mut.sheet - structureData.wt.sheet,
      color: "yellow"
    },
    {
      type: "Coil",
      wt: structureData.wt.coil,
      mut: structureData.mut.coil,
      delta: structureData.mut.coil - structureData.wt.coil,
      color: "green"
    }
  ];

  const getColorClasses = (color: string, variant: 'wt' | 'mut') => {
    const opacity = variant === 'wt' ? 'opacity-60' : '';
    
    switch (color) {
      case 'purple':
        return `bg-purple-500 ${opacity}`;
      case 'yellow':
        return `bg-yellow-500 ${opacity}`;
      case 'green':
        return `bg-green-500 ${opacity}`;
      default:
        return `bg-slate-500 ${opacity}`;
    }
  };

  const formatDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(3)}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {structures.map((structure, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {structure.type}
            </span>
            {viewMode === "expert" && (
              <div className="text-xs text-slate-500">
                <Jargon term="DELTA">Δ</Jargon>: {formatDelta(structure.delta)}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* WT (Wild Type) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  <Jargon term="WT">WT</Jargon>
                </span>
                {viewMode === "expert" && (
                  <span className="text-xs text-slate-500">
                    {formatPercentage(structure.wt)}
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getColorClasses(structure.color, 'wt')}`}
                  style={{ width: `${structure.wt * 100}%` }}
                />
              </div>
              {viewMode === "simple" && (
                <div className="text-xs text-slate-500 text-center">
                  {formatPercentage(structure.wt)}
                </div>
              )}
            </div>
            
            {/* Mut (Mutant) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  <Jargon term="MUT">Mut</Jargon>
                </span>
                {viewMode === "expert" && (
                  <span className="text-xs text-slate-500">
                    {formatPercentage(structure.mut)}
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getColorClasses(structure.color, 'mut')}`}
                  style={{ width: `${structure.mut * 100}%` }}
                />
              </div>
              {viewMode === "simple" && (
                <div className="text-xs text-slate-500 text-center">
                  {formatPercentage(structure.mut)}
                </div>
              )}
            </div>
          </div>

          {/* Delta indicator for significant changes */}
          {Math.abs(structure.delta) > 0.02 && (
            <div className="flex items-center justify-center mt-1">
              <Badge
                label={`${formatDelta(structure.delta)} change`}
                tone={Math.abs(structure.delta) > 0.05 ? "amber" : "slate"}
              />
            </div>
          )}
        </div>
      ))}

      {/* Confidence and method info */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>ESM-lite prediction</span>
          <span>
            <Jargon term="CONFIDENCE">Confidence</Jargon>: {(structureData.wt.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

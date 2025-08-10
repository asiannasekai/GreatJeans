"use client";

import React from "react";
import { CONFIDENCE_LEGEND } from "../content/microcopy";
import { Badge } from "../lib/jargon";

interface ConfidenceLegendProps {
  className?: string;
  collapsed?: boolean;
}

export function ConfidenceLegend({ className = "", collapsed = false }: ConfidenceLegendProps) {
  if (collapsed) {
    return (
      <div 
        className={`text-xs text-slate-500 ${className}`}
        title="Model probabilities, not medical advice."
      >
        Confidence: High ≥0.70, Med 0.40-0.69, Low &lt;0.40
      </div>
    );
  }

  return (
    <div 
      className={`space-y-1 ${className}`}
      title="Model probabilities, not medical advice."
    >
      <div className="text-xs font-medium text-slate-600 mb-2">
        Confidence Legend
      </div>
      {CONFIDENCE_LEGEND.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <Badge 
            label={item.label} 
            tone={
              item.label === "High" ? "green" : 
              item.label === "Medium" ? "amber" : 
              "slate"
            } 
          />
          <span className="text-slate-600">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

export function getConfidenceBadge(confidence: number): { label: string; tone: "green" | "amber" | "slate" } {
  if (confidence >= 0.70) {
    return { label: "High", tone: "green" };
  } else if (confidence >= 0.40) {
    return { label: "Medium", tone: "amber" };
  } else {
    return { label: "Low", tone: "slate" };
  }
}

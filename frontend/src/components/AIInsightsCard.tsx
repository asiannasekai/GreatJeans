"use client";

import React from "react";
import { Sparkles, RotateCcw, ZoomIn, Eye } from "lucide-react";
import { InfoButton } from "./InfoButton";
import { POPOVERS } from "../content/microcopy";
import { useTourElement } from "./OnboardingTour";
import { ResultJSON } from "../lib/api";

interface AIInsightsCardProps {
  result: ResultJSON;
  className?: string;
}

export function AIInsightsCard({ result, className = "" }: AIInsightsCardProps) {
  const tourProps = useTourElement("ai");

  const aiSummary = result.ai_summary;
  const caveats = aiSummary?.caveats || [
    "coverage limits",
    "population limits", 
    "not medical advice"
  ];

  const quickActions = [
    { icon: RotateCcw, label: "Reset View", action: () => console.log("Reset 3D view") },
    { icon: ZoomIn, label: "Zoom to Site", action: () => console.log("Zoom to mutation site") },
    { icon: Eye, label: "Show/Hide", action: () => console.log("Toggle visibility") },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
      {...tourProps}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            AI Insights
          </h2>
          <InfoButton copy={POPOVERS.ai} />
        </div>
        <Sparkles className="w-5 h-5 text-indigo-500" />
      </div>

      <div className="space-y-4">
        {aiSummary?.paragraph && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              {aiSummary.paragraph}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center gap-1 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <action.icon className="w-4 h-4 text-slate-600" />
                <span className="text-xs text-slate-600">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-600 mb-2">
              Important Disclaimers
            </h4>
            {caveats.map((caveat, index) => (
              <div key={index} className="text-xs text-slate-500 flex items-start gap-1">
                <span className="text-slate-400 mt-0.5">•</span>
                <span className="capitalize">{caveat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

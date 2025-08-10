"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { InfoButton } from "./InfoButton";
import { Badge, Jargon } from "../lib/jargon";
import { POPOVERS, EMPTY_STATES, TOOLTIPS } from "../content/microcopy";
import { useAppStore } from "../lib/store";
import { ResultJSON } from "../lib/api";

interface TraitsCardProps {
  result: ResultJSON;
  className?: string;
}

export function TraitsCard({ result, className = "" }: TraitsCardProps) {
  const { viewMode } = useAppStore();

  const traits = result.traits || [];
  const hasTraits = traits.length > 0;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            Traits
          </h2>
          <InfoButton copy={POPOVERS.traits} />
        </div>
      </div>

      {!hasTraits ? (
        <div className="text-sm text-slate-600 py-8 text-center">
          {EMPTY_STATES.traits}
        </div>
      ) : (
        <div className="space-y-3">
          {traits.map((trait, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 mb-1">
                    {trait.trait}
                  </h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>
                      <Jargon term="RSID">{trait.rsid}</Jargon>
                      {trait.your_genotype && (
                        <span className="ml-2">
                          Your genotype: <span className="font-mono">{trait.your_genotype}</span>
                        </span>
                      )}
                    </div>
                    {viewMode === "expert" && trait.effect_allele && (
                      <div className="text-xs text-slate-500">
                        Effect allele: {trait.effect_allele}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    label={trait.status === "covered" ? "Covered" : "Missing"}
                    tone={trait.status === "covered" ? "green" : "slate"}
                  />
                </div>
              </div>

              {trait.source_url && (
                <div className="pt-2 border-t border-slate-200">
                  <a
                    href={trait.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    {viewMode === "simple" ? "Learn more" : "Source"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}

          {viewMode === "simple" && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Badge label="Covered" tone="green" />
                  <span title={TOOLTIPS.COVERED}>Present in your file</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge label="Missing" tone="slate" />
                  <span title={TOOLTIPS.MISSING}>Not measured</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

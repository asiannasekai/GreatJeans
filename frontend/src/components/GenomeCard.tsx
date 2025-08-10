"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { InfoButton } from "./InfoButton";
import { Jargon } from "../lib/jargon";
import { POPOVERS } from "../content/microcopy";
import { useAppStore } from "../lib/store";
import { useTourElement } from "./OnboardingTour";
import { ResultJSON } from "../lib/api";

interface GenomeCardProps {
  result: ResultJSON;
  className?: string;
}

export function GenomeCard({ result, className = "" }: GenomeCardProps) {
  const { viewMode } = useAppStore();
  const tourProps = useTourElement("genome");

  const genomeWindow = result.genome_window;
  const variants = result.variants || [];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
      {...tourProps}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            Genome View
          </h2>
          <InfoButton copy={POPOVERS.genome} />
        </div>
      </div>

      <div className="space-y-4">
        {genomeWindow && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-700 mb-2">Current Window</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <div>
                <span className="font-medium">Location:</span> {genomeWindow.chrom}:{genomeWindow.start.toLocaleString()}-{genomeWindow.end.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">
                  <Jargon term="RSID">rsID</Jargon>:
                </span> {genomeWindow.rsid}
              </div>
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-700">Variants in Region</h3>
            {variants.map((variant, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">
                      <Jargon term="RSID">{variant.rsid}</Jargon>
                    </div>
                    <div className="text-sm text-slate-600">
                      {variant.chrom}:{variant.pos.toLocaleString()} • {variant.genotype}
                    </div>
                    {variant.gene && (
                      <div className="text-sm text-slate-600">
                        Gene: {variant.gene}
                      </div>
                    )}
                    {variant.consequence && (
                      <div className="text-sm text-slate-600">
                        <Jargon term="MISSENSE">
                          {variant.consequence.replace("_", " ")}
                        </Jargon>
                      </div>
                    )}
                  </div>
                </div>

                {variant.links && Object.keys(variant.links).length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(variant.links).map(([source, url]) => (
                        <a
                          key={source}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          {viewMode === "simple" ? "Learn more" : source}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === "expert" && genomeWindow && (
          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
            <div>Window length: {(genomeWindow.end - genomeWindow.start).toLocaleString()} bp</div>
          </div>
        )}
      </div>
    </div>
  );
}

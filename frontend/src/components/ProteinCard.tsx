"use client";

import React from "react";
import { InfoButton } from "./InfoButton";
import { MolstarViewer } from "./MolstarViewer";
import { Jargon } from "../lib/jargon";
import { POPOVERS, EMPTY_STATES } from "../content/microcopy";
import { useAppStore } from "../lib/store";
import { useTourElement } from "./OnboardingTour";
import { ResultJSON } from "../lib/api";

interface ProteinCardProps {
  result: ResultJSON;
  className?: string;
}

export function ProteinCard({ result, className = "" }: ProteinCardProps) {
  const { viewMode } = useAppStore();
  const tourProps = useTourElement("protein3d");

  const protein = result.protein;
  const hasProtein = !!protein;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6 ${className}`}
      {...tourProps}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
            Protein Structure
          </h2>
          <InfoButton copy={POPOVERS.protein} />
        </div>
      </div>

      {!hasProtein ? (
        <div className="text-sm text-slate-600 py-8 text-center">
          {EMPTY_STATES.protein}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 3D Molstar Viewer */}
          <MolstarViewer
            alphafoldUrl={protein.alphafold_cif_url}
            residueIndex={protein.residues?.[0]?.index}
          />

          {protein.residues && protein.residues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-slate-700">
                Affected <Jargon term="RESIDUE">Residues</Jargon>
              </h3>
              {protein.residues.map((residue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {residue.protein_change || `Position ${residue.index}`}
                    </div>
                    <div className="text-xs text-slate-600">
                      <Jargon term="RSID">{residue.rsid}</Jargon>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <div>Position: {residue.index}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Structural context info */}
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2 text-sm flex items-center">
              <span className="text-indigo-600 mr-1">ℹ</span>
              Structural Context
            </h4>
            <div className="text-xs text-indigo-800 space-y-1">
              <p><strong>Protein:</strong> {protein.uniprot} • <strong>AlphaFold Model</strong></p>
              {protein.residues?.[0] && (
                <p><strong>Residue:</strong> {protein.residues[0].index} ({protein.residues[0].protein_change})</p>
              )}
              <p><strong>AlphaFold Confidence:</strong> <span className="text-green-600">Very High (<Jargon term="PLDDT">pLDDT</Jargon> &gt; 90)</span></p>
            </div>
          </div>

          {viewMode === "expert" && protein.uniprot && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <div>UniProt ID: {protein.uniprot}</div>
                {protein.alphafold_cif_url && (
                  <div className="mt-1">
                    <a
                      href={protein.alphafold_cif_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Download AlphaFold Model
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

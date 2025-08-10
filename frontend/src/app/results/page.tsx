'use client';

import React, { useState } from 'react';
import { ProteinTab } from '../../components/ProteinTab';
import { SecondaryStructureBars } from '../../components/SecondaryStructureBars';
import { ResultJson } from '../../types/result';

// Mock result data for testing
const mockResult: ResultJson = {
  protein: {
    uniprot: 'P04637',
    name: 'Tumor protein p53',
    alphafold_cif_url: 'https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v4.cif',
    residues: [
      {
        rsid: 'rs121913343',
        protein_change: 'R175H',
        position: 175
      }
    ]
  },
  mini_model: {
    wt: {
      helix: 0.234,
      sheet: 0.456,
      coil: 0.310,
      confidence: 0.87
    },
    mut: {
      helix: 0.198,
      sheet: 0.521,
      coil: 0.281,
      confidence: 0.83
    }
  },
  variants: [
    {
      rsid: 'rs121913343',
      chromosome: '17',
      position: 7577120,
      ref: 'G',
      alt: 'A'
    }
  ]
};

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<'protein' | 'structure' | 'variants'>('protein');

  const tabs = [
    { id: 'protein' as const, label: 'Protein', description: 'AlphaFold structure with AI insights' },
    { id: 'structure' as const, label: 'Secondary Structure', description: 'Predicted structural changes' },
    { id: 'variants' as const, label: 'Variants', description: 'Genetic variant details' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Analysis Results</h1>
          <p className="text-slate-600">
            Protein: {mockResult.protein?.name} ({mockResult.protein?.uniprot})
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{tab.label}</span>
                    <span className="text-xs text-slate-400 mt-1">{tab.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'protein' && (
            <ProteinTab result={mockResult} />
          )}
          
          {activeTab === 'structure' && (
            <div className="max-w-4xl">
              <SecondaryStructureBars result={mockResult} />
            </div>
          )}
          
          {activeTab === 'variants' && (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Variant Information</h3>
              <div className="space-y-4">
                {mockResult.variants?.map((variant, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">rsID:</span>
                        <div className="text-slate-600">{variant.rsid}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Position:</span>
                        <div className="text-slate-600">{variant.chromosome}:{variant.position}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Change:</span>
                        <div className="text-slate-600">{variant.ref} → {variant.alt}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Protein:</span>
                        <div className="text-slate-600">{mockResult.protein?.residues?.[0]?.protein_change}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
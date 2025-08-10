"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ViewModeToggle } from "../../components/ViewModeToggle";
import { OnboardingTour } from "../../components/OnboardingTour";
import { GlossaryDrawer } from "../../components/GlossaryDrawer";
import { ChatButton } from "../../components/ChatButton";
import { ProteinCard } from "../../components/ProteinCard";
import { SecondaryStructureCard } from "../../components/SecondaryStructureCard";
import { GenomeCard } from "../../components/GenomeCard";
import { TraitsCard } from "../../components/TraitsCard";
import { PGSCard } from "../../components/PGSCard";
import { AIInsightsCard } from "../../components/AIInsightsCard";
import { api, ResultJSON } from "../../lib/api";
import { DEMO_DATA } from "../../lib/demo-data";

export default function ResultsPage() {
  const [result, setResult] = useState<ResultJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load demo data on mount
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      console.log("Attempting to load demo data from API...");
      const demoResult = await api.getDemo();
      console.log("Successfully loaded demo data from API:", demoResult);
      setResult(demoResult);
    } catch (err) {
      console.error("Failed to load demo data from API:", err);
      console.log("Error details:", err);
      console.log("Using fallback demo data...");
      
      // Use fallback demo data
      setResult(DEMO_DATA as ResultJSON);
      setUsingFallback(true);
      console.log("Successfully loaded fallback demo data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "genelens-results.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this analysis? This action cannot be undone.")) {
      // In a real app, this would delete the upload
      setResult(null);
      // Redirect or show empty state
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <FileText className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Results Not Found
          </h1>
          <p className="text-slate-600 mb-4">
            {error}
          </p>
          <button
            onClick={loadDemoData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-slate-400 mb-4">
            <FileText className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            No Results Available
          </h1>
          <p className="text-slate-600 mb-4">
            Upload a genetic data file to see your analysis results.
          </p>
          <button
            onClick={loadDemoData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Go back to home"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-xl font-semibold text-slate-900">
                GeneLens Results
              </h1>
              <ViewModeToggle />
              {usingFallback && (
                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                  Demo Mode
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Download results"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete analysis"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Protein Structure - takes full width on large screens */}
          <div className="lg:col-span-2 xl:col-span-2">
            <ProteinCard result={result} />
          </div>
          
          {/* Secondary Structure */}
          <div className="lg:col-span-1 xl:col-span-1">
            <SecondaryStructureCard result={result} />
          </div>
          
          {/* Genome View */}
          <div className="lg:col-span-1 xl:col-span-1">
            <GenomeCard result={result} />
          </div>
          
          {/* Traits */}
          <div className="lg:col-span-1 xl:col-span-1">
            <TraitsCard result={result} />
          </div>
          
          {/* PGS - conditional */}
          {result.pgs && Object.keys(result.pgs).length > 0 && (
            <div className="lg:col-span-1 xl:col-span-1">
              <PGSCard result={result} />
            </div>
          )}
          
          {/* AI Insights - takes remaining space */}
          <div className="lg:col-span-2 xl:col-span-1">
            <AIInsightsCard result={result} />
          </div>
        </div>

        {/* Quality Control Summary */}
        {result.qc && (
          <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">File Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Format:</span>
                <div className="font-medium">{result.qc.format}</div>
              </div>
              <div>
                <span className="text-slate-600">SNPs:</span>
                <div className="font-medium">{result.qc.n_snps?.toLocaleString()}</div>
              </div>
              {result.qc.missing_pct !== undefined && (
                <div>
                  <span className="text-slate-600">Missing:</span>
                  <div className="font-medium">{(result.qc.missing_pct * 100).toFixed(1)}%</div>
                </div>
              )}
              {result.qc.allele_sanity !== undefined && (
                <div>
                  <span className="text-slate-600">Quality:</span>
                  <div className="font-medium">{(result.qc.allele_sanity * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {result.disclaimer && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Disclaimer:</strong> {result.disclaimer}
            </p>
          </div>
        )}
      </main>

      {/* Global Components */}
      <OnboardingTour />
      <GlossaryDrawer />
      <ChatButton />
    </div>
  );
}

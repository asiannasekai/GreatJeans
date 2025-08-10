"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Back Button */}
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
                Upload Genetic Data
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Upload Your Genetic Data
          </h2>
          <p className="text-slate-600">
            Coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

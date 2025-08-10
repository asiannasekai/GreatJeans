"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleViewDemo = () => {
    router.push('/results');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          GeneLens
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          DNA Analysis Made Simple
        </p>
        <div className="space-x-4">
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Upload File
          </Link>
          <button
            onClick={handleViewDemo}
            className="inline-flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            View Demo
          </button>
        </div>
      </div>
    </div>
  );
}

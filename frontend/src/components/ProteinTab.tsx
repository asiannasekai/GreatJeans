'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MolstarViewer } from './MolstarViewer';
import { InsightsPanel } from './InsightsPanel';
import { MolstarAPI, ViewerCommand, executeCommands } from '../lib/viewerCommands';
import { ResultJson } from '../types/result';

interface ProteinTabProps {
  result: ResultJson;
}

export function ProteinTab({ result }: ProteinTabProps) {
  const molstarRef = useRef<MolstarAPI>(null);
  const [focusedResidue, setFocusedResidue] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast function
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Handle residue focus from viewer
  const handleResidueFocused = useCallback((index: number) => {
    setFocusedResidue(index);
  }, []);

  // Handle commands from insights panel
  const handleCommands = useCallback((commands: ViewerCommand[]) => {
    if (molstarRef.current) {
      executeCommands(commands, molstarRef.current, showToast);
    }
  }, [showToast]);

  // Handle highlight residue button click (for testing)
  const handleHighlightResidue = useCallback((index: number) => {
    if (molstarRef.current) {
      molstarRef.current.highlightResidue(index);
      molstarRef.current.centerOn(index);
      setFocusedResidue(index);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <div className="flex gap-2 p-4 bg-slate-50 rounded-lg">
        <span className="text-sm text-slate-600">Test controls:</span>
        <button
          onClick={() => handleHighlightResidue(72)}
          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Highlight Residue 72
        </button>
        <button
          onClick={() => handleHighlightResidue(45)}
          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Highlight Residue 45
        </button>
        <button
          onClick={() => setFocusedResidue(null)}
          className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Clear Selection
        </button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[600px]">
        {/* Left: Mol* Viewer */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 overflow-hidden"
          >
            <MolstarViewer
              ref={molstarRef}
              cifUrl={result.protein?.alphafold_cif_url}
              onResidueFocused={handleResidueFocused}
              className="h-full"
            />
          </motion.div>
        </div>

        {/* Right: Insights Panel */}
        <div className="w-[480px] flex-shrink-0">
          <InsightsPanel
            result={result}
            focusedResidue={focusedResidue}
            onCommands={handleCommands}
          />
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          {toastMessage}
        </motion.div>
      )}
    </div>
  );
}

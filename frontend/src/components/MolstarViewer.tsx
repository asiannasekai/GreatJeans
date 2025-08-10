'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { MolstarAPI } from '../lib/viewerCommands';

interface MolstarViewerProps {
  cifUrl?: string;
  onResidueFocused?: (index: number) => void;
  className?: string;
}

export const MolstarViewer = forwardRef<MolstarAPI, MolstarViewerProps>(
  ({ cifUrl, onResidueFocused, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      highlightResidue: (index: number) => {
        try {
          // Mock implementation - in real Mol* this would highlight the residue
          console.log(`Highlighting residue ${index}`);
          onResidueFocused?.(index);
        } catch (error) {
          console.error('Failed to highlight residue:', error);
          throw error;
        }
      },
      centerOn: (index: number) => {
        try {
          // Mock implementation - in real Mol* this would center on the residue
          console.log(`Centering on residue ${index}`);
          onResidueFocused?.(index);
        } catch (error) {
          console.error('Failed to center on residue:', error);
          throw error;
        }
      },
      setRepresentation: (mode: "cartoon" | "surface" | "ballAndStick") => {
        try {
          console.log(`Setting representation to ${mode}`);
          // Mock implementation
        } catch (error) {
          console.error('Failed to set representation:', error);
          throw error;
        }
      },
      colorBy: (scheme: "plddt" | "chain" | "uniform") => {
        try {
          console.log(`Coloring by ${scheme}`);
          // Mock implementation
        } catch (error) {
          console.error('Failed to color by scheme:', error);
          throw error;
        }
      },
      toggleSurface: (on: boolean) => {
        try {
          console.log(`Toggling surface ${on ? 'on' : 'off'}`);
          // Mock implementation
        } catch (error) {
          console.error('Failed to toggle surface:', error);
          throw error;
        }
      },
      resetView: () => {
        try {
          console.log('Resetting view');
          // Mock implementation
        } catch (error) {
          console.error('Failed to reset view:', error);
          throw error;
        }
      }
    }), [onResidueFocused]);

    useEffect(() => {
      if (!containerRef.current || !cifUrl) return;

      const loadMolstar = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Mock Mol* viewer loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In real implementation, this would initialize Mol* viewer
          // const viewer = await createMolstarViewer(containerRef.current, cifUrl);
          // viewerRef.current = viewer;
          
          setIsLoading(false);
        } catch (err) {
          console.error('Failed to load Mol* viewer:', err);
          setError(err instanceof Error ? err.message : 'Failed to load viewer');
          setIsLoading(false);
        }
      };

      loadMolstar();

      return () => {
        // Cleanup viewer
        if (viewerRef.current) {
          // viewerRef.current.dispose();
          viewerRef.current = null;
        }
      };
    }, [cifUrl]);

    if (error) {
      return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
          <div className="text-center">
            <div className="text-red-600 text-sm mb-2">Failed to load protein viewer</div>
            <div className="text-xs text-slate-500">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <div className="text-sm text-slate-600">Loading protein structure...</div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <div
          ref={containerRef}
          className="w-full h-full min-h-[400px] bg-slate-50 rounded-lg border border-slate-200"
          style={{ position: 'relative' }}
        >
          {/* Mock protein viewer placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-80"></div>
              <div className="text-sm text-slate-600">Protein Structure Viewer</div>
              <div className="text-xs text-slate-500">Mock implementation</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MolstarViewer.displayName = 'MolstarViewer';

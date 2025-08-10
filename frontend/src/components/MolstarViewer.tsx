"use client";

import React, { useRef, useEffect, useState } from "react";
import { RotateCcw, ZoomIn, Layers } from "lucide-react";

interface MolstarViewerProps {
  alphafoldUrl?: string;
  residueIndex?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    molstar: any;
  }
}

export function MolstarViewer({ 
  alphafoldUrl, 
  residueIndex, 
  className = "",
  onLoad,
  onError 
}: MolstarViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [molstarPlugin, setMolstarPlugin] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [surfaceVisible, setSurfaceVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing Mol*...");

  useEffect(() => {
    if (alphafoldUrl && containerRef.current) {
      loadMolstar();
    }
    
    // Add global event listener to ensure page scrolling works
    const handleGlobalWheel = (e: WheelEvent) => {
      // If the wheel event is not over the molstar container, allow normal scrolling
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        return; // Allow default page scrolling
      }
    };

    document.addEventListener('wheel', handleGlobalWheel, { passive: true });
    
    return () => {
      document.removeEventListener('wheel', handleGlobalWheel);
      if (molstarPlugin) {
        try {
          // Cleanup scroll observer
          if ((molstarPlugin as any).__scrollObserver) {
            (molstarPlugin as any).__scrollObserver.disconnect();
          }
          molstarPlugin.dispose();
        } catch (e) {
          console.error("Error disposing Molstar:", e);
        }
      }
      // Ensure scrolling is restored on cleanup
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [alphafoldUrl]);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.molstar) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load script'));
      document.head.appendChild(script);
    });
  };

  const simulateProgress = () => {
    const steps = [
      { progress: 20, message: "Loading Mol* library..." },
      { progress: 40, message: "Downloading AlphaFold structure..." },
      { progress: 60, message: "Parsing CIF file..." },
      { progress: 80, message: "Initializing 3D viewer..." },
      { progress: 100, message: "Ready!" }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].progress);
        setLoadingMessage(steps[stepIndex].message);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return interval;
  };

  const loadMolstar = async () => {
    if (!containerRef.current || !alphafoldUrl) return;

    setLoading(true);
    setError(null);
    setProgress(10);

    const progressInterval = simulateProgress();

    try {
      // Load Molstar library
      await loadScript('https://molstar.org/viewer/molstar.js');
      
      if (!window.molstar) {
        throw new Error('Mol* library failed to load');
      }

      // Initialize Molstar plugin
      const plugin = await window.molstar.Viewer.create(containerRef.current, {
        layoutShowControls: false,
        layoutShowSequence: false,
        layoutShowLog: false,
        layoutShowLeftPanel: false,
        viewportShowExpand: false,
        pdbProvider: 'rcsb',
        emdbProvider: 'rcsb',
        // Allow page scrolling by preventing event capture outside the viewer
        canvas3d: {
          trackball: {
            noScroll: true // This prevents the viewer from capturing scroll events
          }
        }
      });

      // Load AlphaFold structure
      await plugin.loadStructureFromUrl(alphafoldUrl, 'mmcif');

      // Additional fix: Ensure scroll events don't get captured
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        // Prevent mouse wheel events from bubbling up when not over the canvas
        canvas.addEventListener('wheel', (e) => {
          // Only prevent default if the mouse is actually over the canvas
          // and we're not trying to scroll the page
          if (!e.shiftKey && !e.ctrlKey) {
            e.stopPropagation();
          }
        }, { passive: false });

        // Re-enable page scrolling when mouse leaves the viewer
        canvas.addEventListener('mouseleave', () => {
          document.body.style.overflow = 'auto';
        });

        // Disable page scrolling only when actively interacting with viewer
        canvas.addEventListener('mouseenter', () => {
          // Only disable scroll when actively dragging/rotating
        });
      }

      clearInterval(progressInterval);
      setMolstarPlugin(plugin);
      setLoading(false);
      setProgress(100);
      
      // Ensure page scrolling is re-enabled after Mol* loads
      setTimeout(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        // Add a mutation observer to prevent Mol* from disabling scroll
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
              const target = mutation.target as HTMLElement;
              if (target === document.body || target === document.documentElement) {
                if (target.style.overflow === 'hidden') {
                  target.style.overflow = 'auto';
                }
              }
            }
          });
        });
        
        observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
        
        // Store observer for cleanup
        (plugin as any).__scrollObserver = observer;
      }, 100);
      
      onLoad?.();

    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  };

  const highlightResidue = async () => {
    if (!molstarPlugin || !residueIndex) return;

    try {
      const selection = molstarPlugin.managers.structure.selection.Compiler.compile([
        { residue: { authSeqId: residueIndex } }
      ]);

      molstarPlugin.managers.structure.selection.set(selection);
      molstarPlugin.managers.camera.focusLoci(selection);
    } catch (err) {
      console.error('Failed to highlight residue:', err);
    }
  };

  const resetView = () => {
    if (!molstarPlugin) return;

    try {
      molstarPlugin.managers.camera.reset();
      molstarPlugin.managers.structure.selection.clear();
    } catch (err) {
      console.error('Failed to reset view:', err);
    }
  };

  const toggleSurface = () => {
    if (!molstarPlugin) return;

    try {
      if (surfaceVisible) {
        molstarPlugin.managers.structure.component.setRepresentation('cartoon');
      } else {
        molstarPlugin.managers.structure.component.setRepresentation('surface');
      }
      setSurfaceVisible(!surfaceVisible);
    } catch (err) {
      console.error('Failed to toggle surface:', err);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3D Viewer Container */}
      <div 
        className="molstar-container relative h-64 bg-slate-100 rounded-lg overflow-hidden"
        onWheel={(e) => {
          // Allow page scrolling when wheel event happens outside the actual viewer
          if (!molstarPlugin || loading || error) {
            return; // Let the event bubble up for page scrolling
          }
        }}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{
            // Ensure the viewer container doesn't interfere with page scrolling
            touchAction: 'pan-x pan-y',
            userSelect: 'none'
          }}
        />
        
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading AlphaFold Structure...</p>
              <p className="text-sm text-slate-500 mt-2">{loadingMessage}</p>
              <div className="mt-4 bg-slate-200 rounded-full h-2 w-64 mx-auto">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-600">⚠</span>
              </div>
              <p className="text-red-600 font-medium">Failed to load protein structure</p>
              <p className="text-sm text-slate-600 mt-1">{error}</p>
              <button
                onClick={loadMolstar}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {molstarPlugin && !loading && !error && (
        <div className="flex gap-2 flex-wrap">
          {residueIndex && (
            <button
              onClick={highlightResidue}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              data-tour-id="highlight"
            >
              <ZoomIn className="w-4 h-4 inline mr-1" />
              Highlight Residue {residueIndex}
            </button>
          )}
          
          <button
            onClick={resetView}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            Reset View
          </button>
          
          <button
            onClick={toggleSurface}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <Layers className="w-4 h-4 inline mr-1" />
            {surfaceVisible ? 'Cartoon' : 'Surface'}
          </button>
        </div>
      )}
    </div>
  );
}

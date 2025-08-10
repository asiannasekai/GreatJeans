'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Brain, Eye, Palette, RotateCcw, Loader2 } from 'lucide-react';
import { ViewerCommand } from '../lib/viewerCommands';
import { AiExplainResponse, aiExplain } from '../lib/ai';
import { buildPayload } from '../lib/insightPayload';
import { ResultJson } from '../types/result';

interface InsightsPanelProps {
  result: ResultJson;
  focusedResidue: number | null;
  onCommands?: (cmds: ViewerCommand[]) => void;
}

interface CacheEntry {
  data: AiExplainResponse;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const DEBOUNCE_DELAY = 1000; // 1 second

export function InsightsPanel({ result, focusedResidue, onCommands }: InsightsPanelProps) {
  const [insights, setInsights] = useState<AiExplainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCacheKey = 'insights-cache';

  // Build cache key
  const buildCacheKey = useCallback((residueIndex: number): string => {
    const uniprot = result.protein?.uniprot || 'unknown';
    const rsid = result.protein?.residues?.[0]?.rsid || 'no-rsid';
    return `${uniprot}:${rsid}:${residueIndex}`;
  }, [result]);

  // Load cache from sessionStorage on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(sessionCacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        cacheRef.current = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load insights cache:', error);
    }
  }, []);

  // Save cache to sessionStorage
  const saveCache = useCallback(() => {
    try {
      const cacheObject = Object.fromEntries(cacheRef.current);
      sessionStorage.setItem(sessionCacheKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save insights cache:', error);
    }
  }, []);

  // Get from cache
  const getFromCache = useCallback((key: string): AiExplainResponse | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);

  // Set to cache
  const setToCache = useCallback((key: string, data: AiExplainResponse) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
    saveCache();
  }, [saveCache]);

  // Fetch insights with debouncing and caching
  const fetchInsights = useCallback(async (residueIndex: number) => {
    const cacheKey = buildCacheKey(residueIndex);
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      setInsights(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = buildPayload(result, residueIndex);
      const response = await aiExplain(payload);
      
      setInsights(response);
      setToCache(cacheKey, response);
      
      // Execute any commands from the LLM
      if (response.commands && onCommands) {
        onCommands(response.commands);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch insights';
      setError(errorMsg);
      console.error('Insights fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [result, buildCacheKey, getFromCache, setToCache, onCommands]);

  // Effect to handle focusedResidue changes with debouncing
  useEffect(() => {
    if (focusedResidue === null) {
      setInsights(null);
      setError(null);
      return;
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the fetch
    debounceRef.current = setTimeout(() => {
      fetchInsights(focusedResidue);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [focusedResidue, fetchInsights]);

  // Get confidence level and color
  const getConfidenceInfo = () => {
    const conf = result.mini_model?.wt?.confidence || result.mini_model?.mut?.confidence;
    if (!conf) return { level: 'Unknown', color: 'bg-slate-100 text-slate-600' };
    
    if (conf < 0.4) return { level: 'Low', color: 'bg-red-100 text-red-700' };
    if (conf < 0.7) return { level: 'Med', color: 'bg-yellow-100 text-yellow-700' };
    return { level: 'High', color: 'bg-green-100 text-green-700' };
  };

  const confidenceInfo = getConfidenceInfo();

  // Action handlers
  const handleAction = (command: ViewerCommand) => {
    if (onCommands) {
      onCommands([command]);
    }
  };

  const handleExplainSite = () => {
    if (focusedResidue !== null) {
      fetchInsights(focusedResidue);
    }
  };

  if (focusedResidue === null) {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5 p-6">
          <div className="text-center text-slate-500">
            <Brain className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Select a residue to see AI insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg/5"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-slate-800">Insights</h3>
            <div className="flex gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${confidenceInfo.color}`}>
                Confidence: {confidenceInfo.level}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-700">
                pLDDT: Very High
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Residue {focusedResidue} • {result.protein?.uniprot}
          </p>
        </div>

        {/* Body */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing residue...
                </div>
                {/* Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-4/5"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-3/5"></div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" />
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                  onClick={handleExplainSite}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </motion.div>
            ) : insights ? (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Insights */}
                <div className="space-y-2">
                  {insights.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Action Chips */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAction({ name: "centerOn", args: { index: focusedResidue } })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Center
                  </button>
                  <button
                    onClick={() => handleAction({ name: "toggleSurface", args: { on: true } })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Surface
                  </button>
                  <button
                    onClick={() => handleAction({ name: "colorBy", args: { scheme: "plddt" } })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
                  >
                    <Palette className="h-3 w-3" />
                    Color pLDDT
                  </button>
                  <button
                    onClick={() => handleAction({ name: "resetView", args: {} })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>

                {/* Explain Button */}
                <button
                  onClick={handleExplainSite}
                  className="w-full rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Explain this site
                </button>

                {/* Caveats */}
                {insights.caveats && insights.caveats.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500 space-y-1">
                      {insights.caveats.map((caveat, index) => (
                        <div key={index} className="flex items-start gap-1">
                          <span className="text-slate-400">•</span>
                          <span>{caveat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

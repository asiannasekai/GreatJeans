'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResultJson } from '../types/result';

interface SecondaryStructureBarsProps {
  result: ResultJson;
}

export function SecondaryStructureBars({ result }: SecondaryStructureBarsProps) {
  const miniModel = result.mini_model;

  if (!miniModel || !miniModel.wt || !miniModel.mut) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600 text-center">
          Secondary structure prediction not available for this variant
        </p>
      </div>
    );
  }

  const { wt, mut } = miniModel;

  // Calculate deltas
  const deltaH = (mut.helix || 0) - (wt.helix || 0);
  const deltaE = (mut.sheet || 0) - (wt.sheet || 0);
  const deltaC = (mut.coil || 0) - (wt.coil || 0);

  const structures = [
    {
      name: 'Helix',
      symbol: 'H',
      wt: wt.helix || 0,
      mut: mut.helix || 0,
      delta: deltaH,
      color: 'bg-red-500'
    },
    {
      name: 'Sheet', 
      symbol: 'E',
      wt: wt.sheet || 0,
      mut: mut.sheet || 0,
      delta: deltaE,
      color: 'bg-blue-500'
    },
    {
      name: 'Coil',
      symbol: 'C', 
      wt: wt.coil || 0,
      mut: mut.coil || 0,
      delta: deltaC,
      color: 'bg-green-500'
    }
  ];

  const formatDelta = (delta: number): string => {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(3)}`;
  };

  const getDeltaColor = (delta: number): string => {
    if (Math.abs(delta) < 0.01) return 'text-slate-500';
    return delta > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Secondary Structure</h3>
        <div className="flex gap-4 text-xs text-slate-600">
          <span>WT Confidence: {((wt.confidence || 0) * 100).toFixed(1)}%</span>
          <span>Mut Confidence: {((mut.confidence || 0) * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {structures.map((struct, index) => (
          <motion.div
            key={struct.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-mono">
                  {struct.symbol}
                </span>
                <span className="text-sm font-medium text-slate-700">{struct.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600">
                  WT: {struct.wt.toFixed(3)}
                </span>
                <span className="text-slate-600">
                  Mut: {struct.mut.toFixed(3)}
                </span>
                <span className={`font-medium ${getDeltaColor(struct.delta)}`}>
                  Δ: {formatDelta(struct.delta)}
                </span>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-8 text-slate-500">WT</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(struct.wt * 100).toFixed(1)}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                    className={`h-full ${struct.color} opacity-70`}
                  />
                </div>
                <span className="w-12 text-slate-600">{(struct.wt * 100).toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <span className="w-8 text-slate-500">Mut</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(struct.mut * 100).toFixed(1)}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    className={`h-full ${struct.color}`}
                  />
                </div>
                <span className="w-12 text-slate-600">{(struct.mut * 100).toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

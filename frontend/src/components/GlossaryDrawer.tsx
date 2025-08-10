"use client";

import React, { useState, useMemo } from "react";
import { X, Search, BookOpen } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { TOOLTIPS } from "../content/microcopy";
import { cn } from "../lib/utils";

interface GlossaryDrawerProps {
  trigger?: React.ReactNode;
}

export function GlossaryDrawer({ trigger }: GlossaryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.entries(TOOLTIPS);
    }
    
    const query = searchQuery.toLowerCase();
    return Object.entries(TOOLTIPS).filter(([term, definition]) => 
      term.toLowerCase().includes(query) || 
      definition.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const defaultTrigger = (
    <button
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
      aria-label="Open glossary"
    >
      <BookOpen className="w-4 h-4" />
      <span className="text-sm font-medium">Glossary</span>
    </button>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger || defaultTrigger}
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col focus:outline-none"
          onEscapeKeyDown={() => setOpen(false)}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Glossary
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close glossary"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {filteredTerms.length > 0 ? (
                filteredTerms.map(([term, definition]) => (
                  <div key={term} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <dt className="font-medium text-slate-900 mb-1">
                      {term}
                    </dt>
                    <dd className="text-sm text-slate-700 leading-relaxed">
                      {definition}
                    </dd>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No terms found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "../lib/utils";

interface InfoButtonProps {
  copy: {
    title: string;
    body: string;
  };
  className?: string;
}

export function InfoButton({ copy, className }: InfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors",
            className
          )}
          aria-expanded={open}
          aria-label={`More information about ${copy.title}`}
        >
          <Info className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
          sideOffset={4}
          role="dialog"
          aria-labelledby="popover-title"
        >
          <div className="space-y-2">
            <h3 
              id="popover-title"
              className="font-semibold text-slate-900"
            >
              {copy.title}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {copy.body}
            </p>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

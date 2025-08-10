"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { TOUR_STEPS } from "../content/microcopy";

const TOUR_STORAGE_KEY = "genelens:tourDone";

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const findElement = (id: string): HTMLElement | null => {
    // Try different selector strategies
    const selectors = [
      `[data-tour-id="${id}"]`,
      `#${id}`,
      `[id*="${id}"]`,
      `[class*="${id}"]`
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
    }
    return null;
  };

  const getElementPosition = (id: string) => {
    const element = findElement(id);
    if (!element) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.bottom + scrollTop + 10,
      left: rect.left + scrollLeft + rect.width / 2,
      transform: "translateX(-50%)"
    };
  };

  const highlightElement = (id: string) => {
    const element = findElement(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.style.outline = "2px solid #6366f1";
      element.style.outlineOffset = "4px";
      element.style.borderRadius = "8px";
      
      // Remove highlight after tour step changes
      setTimeout(() => {
        element.style.outline = "";
        element.style.outlineOffset = "";
        element.style.borderRadius = "";
      }, 500);
    }
  };

  useEffect(() => {
    if (isVisible && TOUR_STEPS[currentStep]) {
      highlightElement(TOUR_STEPS[currentStep].id);
    }
  }, [currentStep, isVisible]);

  if (!isClient || !isVisible) return null;

  const currentTourStep = TOUR_STEPS[currentStep];
  const position = getElementPosition(currentTourStep.id);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Tour Card */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: "absolute",
            top: position.top,
            left: position.left,
            transform: position.transform,
            zIndex: 51
          }}
          className="bg-white rounded-lg shadow-xl border border-slate-200 p-6 max-w-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-medium flex items-center justify-center">
                {currentStep + 1}
              </div>
              <h3 className="font-semibold text-slate-900">
                {currentTourStep.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <p className="text-sm text-slate-700 mb-4 leading-relaxed">
            {currentTourStep.body}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
              >
                {currentStep < TOUR_STEPS.length - 1 ? "Next" : "Done"}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Helper function to mark tour elements
export function useTourElement(id: string) {
  return {
    "data-tour-id": id
  };
}

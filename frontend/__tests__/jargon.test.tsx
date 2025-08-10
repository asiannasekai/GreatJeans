import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Jargon, Badge } from "../src/lib/jargon";

describe("Jargon Component", () => {
  it("renders jargon term with tooltip", () => {
    render(<Jargon term="WT" />);
    
    const element = screen.getByText("WT");
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass("underline", "decoration-dotted", "cursor-help");
    expect(element).toHaveAttribute("title", "The standard protein sequence used for comparison.");
  });

  it("renders custom children instead of term", () => {
    render(<Jargon term="WT">Wild Type</Jargon>);
    
    expect(screen.getByText("Wild Type")).toBeInTheDocument();
    expect(screen.queryByText("WT")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover and focus", async () => {
    const user = userEvent.setup();
    render(<Jargon term="CONFIDENCE" />);
    
    const element = screen.getByText("CONFIDENCE");
    
    // Test hover
    await user.hover(element);
    expect(element).toHaveAttribute("title", "How sure our small predictor is about its estimate.");
    
    // Test focus (for accessibility)
    element.focus();
    expect(element).toHaveAttribute("aria-label", "How sure our small predictor is about its estimate.");
  });
});

describe("Badge Component", () => {
  it("renders badge with default styling", () => {
    render(<Badge label="Test" />);
    
    const badge = screen.getByText("Test");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("border-slate-200", "text-slate-600");
  });

  it("applies correct styling for different tones", () => {
    const { rerender } = render(<Badge label="High" tone="green" />);
    expect(screen.getByText("High")).toHaveClass("border-emerald-200", "text-emerald-700");
    
    rerender(<Badge label="Medium" tone="amber" />);
    expect(screen.getByText("Medium")).toHaveClass("border-amber-200", "text-amber-700");
    
    rerender(<Badge label="Low" tone="slate" />);
    expect(screen.getByText("Low")).toHaveClass("border-slate-200", "text-slate-600");
  });
});

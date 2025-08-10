import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ViewModeToggle } from "../src/components/ViewModeToggle";

// Mock the store
jest.mock("../src/lib/store", () => ({
  useAppStore: jest.fn()
}));

import { useAppStore } from "../src/lib/store";
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe("ViewModeToggle", () => {
  const mockSetViewMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows simple mode as active by default", () => {
    mockUseAppStore.mockReturnValue({
      viewMode: "simple",
      setViewMode: mockSetViewMode
    });

    render(<ViewModeToggle />);
    
    const simpleButton = screen.getByText("Simple");
    const expertButton = screen.getByText("Expert");
    
    expect(simpleButton).toHaveClass("bg-indigo-600", "text-white");
    expect(expertButton).toHaveClass("text-slate-600");
  });

  it("shows expert mode as active when selected", () => {
    mockUseAppStore.mockReturnValue({
      viewMode: "expert",
      setViewMode: mockSetViewMode
    });

    render(<ViewModeToggle />);
    
    const simpleButton = screen.getByText("Simple");
    const expertButton = screen.getByText("Expert");
    
    expect(expertButton).toHaveClass("bg-indigo-600", "text-white");
    expect(simpleButton).toHaveClass("text-slate-600");
  });

  it("calls setViewMode when buttons are clicked", async () => {
    const user = userEvent.setup();
    mockUseAppStore.mockReturnValue({
      viewMode: "simple",
      setViewMode: mockSetViewMode
    });

    render(<ViewModeToggle />);
    
    const expertButton = screen.getByText("Expert");
    await user.click(expertButton);
    
    expect(mockSetViewMode).toHaveBeenCalledWith("expert");
  });

  it("persists selection to localStorage", async () => {
    const user = userEvent.setup();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });

    mockUseAppStore.mockReturnValue({
      viewMode: "simple",
      setViewMode: mockSetViewMode
    });

    render(<ViewModeToggle />);
    
    const expertButton = screen.getByText("Expert");
    await user.click(expertButton);
    
    expect(mockSetViewMode).toHaveBeenCalledWith("expert");
  });
});

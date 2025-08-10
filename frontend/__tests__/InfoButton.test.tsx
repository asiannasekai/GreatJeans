import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { InfoButton } from "../src/components/InfoButton";

const mockCopy = {
  title: "Test Title",
  body: "Test body content for the info popover."
};

describe("InfoButton", () => {
  it("renders info button with proper accessibility", () => {
    render(<InfoButton copy={mockCopy} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-label", "More information about Test Title");
  });

  it("opens popover on click", async () => {
    const user = userEvent.setup();
    render(<InfoButton copy={mockCopy} />);
    
    const button = screen.getByRole("button");
    await user.click(button);
    
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test body content for the info popover.")).toBeInTheDocument();
  });

  it("opens popover on Enter key", async () => {
    const user = userEvent.setup();
    render(<InfoButton copy={mockCopy} />);
    
    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");
    
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

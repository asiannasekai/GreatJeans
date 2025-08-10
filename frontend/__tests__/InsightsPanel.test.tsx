import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { InsightsPanel } from '../components/InsightsPanel';
import { aiExplain } from '../lib/ai';
import { ResultJson } from '../types/result';

// Mock the AI module
jest.mock('../lib/ai');
const mockAiExplain = aiExplain as jest.MockedFunction<typeof aiExplain>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockResult: ResultJson = {
  protein: {
    uniprot: 'P04637',
    name: 'Test Protein',
    residues: [{ rsid: 'rs123', protein_change: 'R175H' }]
  },
  mini_model: {
    wt: { helix: 0.2, sheet: 0.4, coil: 0.4, confidence: 0.8 },
    mut: { helix: 0.3, sheet: 0.3, coil: 0.4, confidence: 0.7 }
  }
};

describe('InsightsPanel', () => {
  beforeEach(() => {
    mockAiExplain.mockClear();
    // Clear sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('calls aiExplain when focusedResidue changes', async () => {
    mockAiExplain.mockResolvedValue({
      insights: ['Test insight'],
      caveats: ['Test caveat']
    });

    const { rerender } = render(
      <InsightsPanel
        result={mockResult}
        focusedResidue={null}
        onCommands={jest.fn()}
      />
    );

    // Should not call AI initially
    expect(mockAiExplain).not.toHaveBeenCalled();

    // Change focused residue
    rerender(
      <InsightsPanel
        result={mockResult}
        focusedResidue={72}
        onCommands={jest.fn()}
      />
    );

    // Should call AI after debounce
    await waitFor(() => {
      expect(mockAiExplain).toHaveBeenCalledWith(
        expect.objectContaining({
          protein: { uniprot: 'P04637', name: 'Test Protein' },
          variant: expect.objectContaining({ index: 72 })
        })
      );
    }, { timeout: 2000 });
  });

  it('uses cache on repeat calls', async () => {
    mockAiExplain.mockResolvedValue({
      insights: ['Cached insight'],
      caveats: ['Cached caveat']
    });

    const { rerender } = render(
      <InsightsPanel
        result={mockResult}
        focusedResidue={72}
        onCommands={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockAiExplain).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    // Clear and set same residue again
    rerender(
      <InsightsPanel
        result={mockResult}
        focusedResidue={null}
        onCommands={jest.fn()}
      />
    );

    rerender(
      <InsightsPanel
        result={mockResult}
        focusedResidue={72}
        onCommands={jest.fn()}
      />
    );

    // Should not call AI again due to caching
    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(mockAiExplain).toHaveBeenCalledTimes(1);
  });

  it('renders insights and caveats', async () => {
    mockAiExplain.mockResolvedValue({
      insights: ['First insight', 'Second insight'],
      caveats: ['Educational only', 'Not medical advice']
    });

    render(
      <InsightsPanel
        result={mockResult}
        focusedResidue={72}
        onCommands={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First insight')).toBeInTheDocument();
      expect(screen.getByText('Second insight')).toBeInTheDocument();
      expect(screen.getByText('Educational only')).toBeInTheDocument();
      expect(screen.getByText('Not medical advice')).toBeInTheDocument();
    });
  });

  it('renders action chips', async () => {
    mockAiExplain.mockResolvedValue({
      insights: ['Test insight'],
      caveats: ['Test caveat']
    });

    const mockOnCommands = jest.fn();

    render(
      <InsightsPanel
        result={mockResult}
        focusedResidue={72}
        onCommands={mockOnCommands}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Center')).toBeInTheDocument();
      expect(screen.getByText('Surface')).toBeInTheDocument();
      expect(screen.getByText('Color pLDDT')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    // Test clicking center button
    fireEvent.click(screen.getByText('Center'));
    expect(mockOnCommands).toHaveBeenCalledWith([
      { name: 'centerOn', args: { index: 72 } }
    ]);
  });
});

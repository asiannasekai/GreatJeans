import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProteinTab } from '../components/ProteinTab';
import { ResultJson } from '../types/result';

// Mock components
jest.mock('../components/MolstarViewer', () => ({
  MolstarViewer: React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      highlightResidue: jest.fn(),
      centerOn: jest.fn(),
      setRepresentation: jest.fn(),
      colorBy: jest.fn(),
      toggleSurface: jest.fn(),
      resetView: jest.fn(),
    }));
    return <div data-testid="molstar-viewer">Mol* Viewer</div>;
  }),
}));

jest.mock('../components/InsightsPanel', () => ({
  InsightsPanel: ({ focusedResidue }: any) => (
    <div data-testid="insights-panel">
      Insights Panel - Focused: {focusedResidue}
    </div>
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockResult: ResultJson = {
  protein: {
    uniprot: 'P04637',
    name: 'Test Protein',
    alphafold_cif_url: 'https://example.com/protein.cif',
  },
};

describe('ProteinTab', () => {
  it('renders viewer and insights panel', () => {
    render(<ProteinTab result={mockResult} />);

    expect(screen.getByTestId('molstar-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
  });

  it('clicking highlight residue 72 sets focused residue', () => {
    render(<ProteinTab result={mockResult} />);

    fireEvent.click(screen.getByText('Highlight Residue 72'));

    expect(screen.getByText('Insights Panel - Focused: 72')).toBeInTheDocument();
  });

  it('clicking clear selection clears focused residue', () => {
    render(<ProteinTab result={mockResult} />);

    // First set a residue
    fireEvent.click(screen.getByText('Highlight Residue 72'));
    expect(screen.getByText('Insights Panel - Focused: 72')).toBeInTheDocument();

    // Then clear it
    fireEvent.click(screen.getByText('Clear Selection'));
    expect(screen.getByText('Insights Panel - Focused:')).toBeInTheDocument();
  });
});

import { executeCommands, ViewerCommand, MolstarAPI } from '../lib/viewerCommands';
import { jest } from '@jest/globals';

describe('viewerCommands', () => {
  let mockApi: jest.Mocked<MolstarAPI>;
  let mockToast: jest.MockedFunction<(msg: string) => void>;

  beforeEach(() => {
    mockApi = {
      highlightResidue: jest.fn(),
      centerOn: jest.fn(),
      setRepresentation: jest.fn(),
      colorBy: jest.fn(),
      toggleSurface: jest.fn(),
      resetView: jest.fn(),
    };
    mockToast = jest.fn();
  });

  it('executes whitelisted commands', () => {
    const commands: ViewerCommand[] = [
      { name: 'highlightResidue', args: { index: 72 } },
      { name: 'centerOn', args: { index: 72 } },
      { name: 'setRepresentation', args: { mode: 'cartoon' } },
      { name: 'colorBy', args: { scheme: 'plddt' } },
      { name: 'toggleSurface', args: { on: true } },
      { name: 'resetView', args: {} },
    ];

    executeCommands(commands, mockApi, mockToast);

    expect(mockApi.highlightResidue).toHaveBeenCalledWith(72);
    expect(mockApi.centerOn).toHaveBeenCalledWith(72);
    expect(mockApi.setRepresentation).toHaveBeenCalledWith('cartoon');
    expect(mockApi.colorBy).toHaveBeenCalledWith('plddt');
    expect(mockApi.toggleSurface).toHaveBeenCalledWith(true);
    expect(mockApi.resetView).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('ignores unknown commands', () => {
    const commands = [
      { name: 'unknownCommand', args: { param: 'value' } },
      { name: 'centerOn', args: { index: 72 } },
    ] as ViewerCommand[];

    executeCommands(commands, mockApi, mockToast);

    expect(mockApi.centerOn).toHaveBeenCalledWith(72);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('handles errors without crashing', () => {
    mockApi.centerOn.mockImplementation(() => {
      throw new Error('Mock error');
    });

    const commands: ViewerCommand[] = [
      { name: 'centerOn', args: { index: 72 } },
      { name: 'resetView', args: {} },
    ];

    expect(() => executeCommands(commands, mockApi, mockToast)).not.toThrow();

    expect(mockApi.centerOn).toHaveBeenCalledWith(72);
    expect(mockApi.resetView).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith('Failed to execute centerOn: Mock error');
  });
});

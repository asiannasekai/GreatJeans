export type ViewerCommand =
  | { name: "highlightResidue"; args: { index: number } }
  | { name: "centerOn"; args: { index: number } }
  | { name: "setRepresentation"; args: { mode: "cartoon" | "surface" | "ballAndStick" } }
  | { name: "colorBy"; args: { scheme: "plddt" | "chain" | "uniform" } }
  | { name: "toggleSurface"; args: { on: boolean } }
  | { name: "resetView"; args: {} };

export interface MolstarAPI {
  highlightResidue: (index: number) => void;
  centerOn: (index: number) => void;
  setRepresentation: (mode: "cartoon" | "surface" | "ballAndStick") => void;
  colorBy: (scheme: "plddt" | "chain" | "uniform") => void;
  toggleSurface: (on: boolean) => void;
  resetView: () => void;
}

export function executeCommands(
  cmds: ViewerCommand[], 
  api: MolstarAPI, 
  toast: (msg: string) => void
): void {
  for (const cmd of cmds) {
    try {
      switch (cmd.name) {
        case "highlightResidue":
          api.highlightResidue(cmd.args.index);
          break;
        case "centerOn":
          api.centerOn(cmd.args.index);
          break;
        case "setRepresentation":
          api.setRepresentation(cmd.args.mode);
          break;
        case "colorBy":
          api.colorBy(cmd.args.scheme);
          break;
        case "toggleSurface":
          api.toggleSurface(cmd.args.on);
          break;
        case "resetView":
          api.resetView();
          break;
        default:
          console.warn(`Unknown viewer command: ${(cmd as any).name}`);
      }
    } catch (error) {
      console.error(`Failed to execute command ${cmd.name}:`, error);
      toast(`Failed to execute ${cmd.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

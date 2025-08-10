import { AiExplainInput } from './ai';
import { ResultJson } from '../types/result';

export function buildPayload(result: ResultJson, residueIndex: number): AiExplainInput {
  const rs = result.protein?.residues?.[0]?.rsid;
  const change = result.protein?.residues?.[0]?.protein_change;
  const plddt_bin = inferPlddtBinFromURL(result.protein?.alphafold_cif_url);
  const mm = result.mini_model;

  return {
    protein: { 
      uniprot: result.protein?.uniprot || '',
      name: result.protein?.name 
    },
    variant: rs || change ? {
      rsid: rs,
      change,
      index: residueIndex
    } : undefined,
    alphafold: { plddt_bin },
    mini_model: mm ? {
      wt: { 
        H: mm.wt?.helix || 0, 
        E: mm.wt?.sheet || 0, 
        C: mm.wt?.coil || 0, 
        conf: mm.wt?.confidence 
      },
      mut: { 
        H: mm.mut?.helix || 0, 
        E: mm.mut?.sheet || 0, 
        C: mm.mut?.coil || 0, 
        conf: mm.mut?.confidence 
      }
    } : undefined
  };
}

function inferPlddtBinFromURL(url?: string): "very_high" | "high" | "low" {
  // Stub implementation - in practice this could parse AlphaFold confidence from URL or metadata
  // For now, return a sensible default
  return "very_high";
}

export interface ResultJson {
  protein?: {
    uniprot: string;
    name?: string;
    alphafold_cif_url?: string;
    residues?: Array<{
      rsid?: string;
      protein_change?: string;
      position?: number;
    }>;
  };
  mini_model?: {
    wt?: {
      helix?: number;
      sheet?: number;
      coil?: number;
      confidence?: number;
    };
    mut?: {
      helix?: number;
      sheet?: number;
      coil?: number;
      confidence?: number;
    };
  };
  variants?: Array<{
    rsid?: string;
    chromosome?: string;
    position?: number;
    ref?: string;
    alt?: string;
  }>;
}
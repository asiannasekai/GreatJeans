from typing import List, Dict, Tuple, Optional
import csv
import os
from .types import Variant

def build_protein_targets(
    variants: List[Variant], paths: Dict, preferred_rsid: Optional[str]
) -> Tuple[Optional[Dict], List[str]]:
    """
    Build a protein target object for Mol* UI from variants and protein_map.csv.
    Prefer preferred_rsid if present in both user variants and CSV, else first matching rsID.
    Returns (protein_object, notes).
    Time complexity: O(N+M) for N variants, M protein rows.
    """
    import time
    t0 = time.time()
    data_dir = paths["data_dir"]
    protein_map_path = os.path.join(data_dir, "protein_map.csv")
    notes = []

    # Load protein map
    protein_rows = []
    with open(protein_map_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            protein_rows.append(row)

    # Build lookup for user variants
    user_rsids = {v["rsid"]: v for v in variants}

    # Find candidate rows
    candidates = [r for r in protein_rows if r["rsid"] in user_rsids]

    # Prefer preferred_rsid if present
    chosen = None
    if preferred_rsid and preferred_rsid in user_rsids:
        for r in candidates:
            if r["rsid"] == preferred_rsid:
                chosen = r
                break
    if not chosen and candidates:
        chosen = candidates[0]

    if not chosen:
        notes.append(f"timing:build_protein_targets:{(time.time()-t0)*1000:.1f}ms")
        return None, ["no_protein_mapped"]

    # Build protein object
    protein_obj = {
        "uniprot": chosen["uniprot"],
        "alphafold_cif_url": chosen["alphafold_cif_url"],
        "residues": []
    }
    # Collect all residues for this protein and user variants
    for r in protein_rows:
        if r["uniprot"] == chosen["uniprot"] and r["rsid"] in user_rsids:
            protein_obj["residues"].append({
                "rsid": r["rsid"],
                "index": int(r["residue_index"]),
                "protein_change": r["protein_change"]
            })
    notes.append(f"timing:build_protein_targets:{(time.time()-t0)*1000:.1f}ms")
    return protein_obj, notes

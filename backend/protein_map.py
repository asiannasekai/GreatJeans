"""Protein mapping helper for building Mol* highlight block."""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional


def build_protein_target(variants: List[Dict[str, Any]], csv_path: Path, preferred_rsid: str | None = None) -> Optional[Dict[str, Any]]:
    if not csv_path.exists():
        return None
    pm = pd.read_csv(csv_path)
    if pm.empty:
        return None
    var_set = {v['rsid'] for v in variants if v.get('rsid')}
    target_row = None
    if preferred_rsid and preferred_rsid in var_set:
        subset = pm[pm['rsid'] == preferred_rsid]
        if not subset.empty:
            target_row = subset.iloc[0]
    if target_row is None:
        for rs in var_set:
            sub = pm[pm['rsid'] == rs]
            if not sub.empty:
                target_row = sub.iloc[0]
                break
    if target_row is None:
        return None
    residues = [{
        'rsid': target_row.rsid,
        'index': int(target_row.residue_index),
        'protein_change': target_row.protein_change
    }]
    return {
        'uniprot': target_row.uniprot,
        'alphafold_cif_url': target_row.alphafold_cif_url,
        'residues': residues
    }

__all__ = ['build_protein_target']

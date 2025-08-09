"""Tiny polygenic score demo for BMI."""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from typing import Dict, Any
from .annotate_local import PGS_FILE


def compute_bmi_pgs(df_variants: pd.DataFrame):
    if not Path(PGS_FILE).exists():
        return None
    pgs_df = pd.read_csv(PGS_FILE)
    if pgs_df.empty:
        return None
    geno_map = df_variants.set_index('rsid')['genotype'].to_dict()
    score = 0.0
    weight_sum = 0.0
    for r in pgs_df.itertuples():
        g = geno_map.get(r.rsid)
        if not g:
            continue
        # count effect alleles
        ea = r.effect_allele
        count = sum(1 for a in g if a == ea)
        score += count * r.weight
        weight_sum += abs(r.weight)
    if weight_sum == 0:
        return None
    z = score / (weight_sum / len(pgs_df))
    percentile = int(min(99, max(1, 50 + z * 10)))
    return {
        'bmi': {
            'z': round(z,3),
            'percentile': percentile,
            'pgs_id': 'PGS000xxx',
            'note': 'relative only'
        }
    }

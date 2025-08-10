from typing import List, Dict, Tuple
import csv
import os
from .types import Variant
from .utils import normalize_genotype, dosage_for_effect, percentile_from_z, safe_float

def compute_pgs_bmi(variants: List[Variant], paths: Dict) -> Tuple[Dict, List[str]]:
    """
    Compute a demo PGS for BMI using pgs_bmi_small.csv. Returns ({bmi: {...}}, notes).
    Handles missing variants gracefully.
    Time complexity: O(N+M) for N variants, M SNPs.
    """
    import time
    t0 = time.time()
    data_dir = paths["data_dir"]
    pgs_path = os.path.join(data_dir, "pgs_bmi_small.csv")
    notes = []

    # Load PGS SNPs
    snps = []
    with open(pgs_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            snps.append(row)

    # Build rsid -> variant lookup
    variant_lookup = {v["rsid"]: v for v in variants}

    score = 0.0
    missing_snps = 0
    for snp in snps:
        rsid = snp["rsid"]
        weight = safe_float(snp["weight"])
        effect_allele = snp["effect_allele"]
        variant = variant_lookup.get(rsid)
        if variant:
            d = dosage_for_effect(variant["genotype"], effect_allele)
        else:
            d = 0
            missing_snps += 1
        score += weight * d

    # Demo constants
    mean = 0.0
    sd = 1.0
    z = (score - mean) / sd if sd != 0 else 0.0
    percentile = percentile_from_z(z)

    result = {
        "bmi": {
            "z": z,
            "percentile": percentile,
            "pgs_id": "PGS000000-demo",
            "note": "relative only"
        }
    }
    notes.append(f"missing_snps: {missing_snps}")
    notes.append(f"timing:compute_pgs_bmi:{(time.time()-t0)*1000:.1f}ms")
    return result, notes

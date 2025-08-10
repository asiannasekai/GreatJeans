from typing import List, Dict, Tuple
import csv
import os
from .types import Variant
from .links import dbsnp_link, ensembl_link

def join_annotations(variants: List[Variant], paths: Dict) -> Tuple[List[Dict], List[str]]:
    """
    Annotate variants with dbsnp/ensembl links and join traits with coverage flags.
    Loads traits_catalog.csv and clinvar_light.csv from paths["data_dir"].
    Returns (annotated_variants, notes). Traits are included in notes as a summary.
    Time complexity: O(N+M) for N variants, M traits.
    """
    import time
    t0 = time.time()
    data_dir = paths["data_dir"]
    traits_path = os.path.join(data_dir, "traits_catalog.csv")
    clinvar_path = os.path.join(data_dir, "clinvar_light.csv")
    notes = []

    # Build rsid -> variant lookup
    variant_lookup = {v["rsid"]: v for v in variants}

    # Annotate variants with links
    annotated_variants = []
    for v in variants:
        links = {
            "dbsnp": dbsnp_link(v["rsid"]),
            "ensembl": ensembl_link(v.get("chrom", ""), v.get("pos", ""), v["rsid"])
        }
        annotated = dict(v)
        annotated["links"] = links
        annotated_variants.append(annotated)

    # Process traits
    traits = []
    with open(traits_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rsid = row["rsid"]
            trait_row = {
                "trait": row["trait"],
                "rsid": rsid,
                "effect_allele": row.get("effect_allele"),
                "your_genotype": None,
                "status": "missing",
                "source_url": row.get("source_url")
            }
            if rsid in variant_lookup:
                trait_row["status"] = "covered"
                trait_row["your_genotype"] = variant_lookup[rsid]["genotype"]
            traits.append(trait_row)
    notes.append(f"Traits coverage: {sum(t['status']=='covered' for t in traits)}/{len(traits)} covered.")
    notes.append(f"Traits details: {traits}")
    notes.append(f"timing:join_annotations:{(time.time()-t0)*1000:.1f}ms")
    return annotated_variants, notes

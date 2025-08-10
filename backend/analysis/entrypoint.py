"""
Integration entrypoint for Winsly's analysis pipeline.
Example:
    python -m backend.analysis.entrypoint
"""
from typing import Dict, List
import os
import json
from .pipeline import run_analysis
from .types import Variant, AnalysisConfig

def analyze_entry(variants: List[Dict], cfg: Dict, paths: Dict) -> Dict:
    """
    Simple wrapper around run_analysis that handles dict inputs.
    Args:
        variants: List of variant dicts with rsid, chrom, pos, genotype
        cfg: Dict with run_traits, run_protein, run_pgs flags
        paths: Dict with data_dir path
    Returns:
        Analysis result dict with variants, traits, protein, pgs sections
    """
    return run_analysis(variants, cfg, paths)

if __name__ == "__main__":
    # Demo using small set of variants
    demo_variants = [
        {"rsid": "rs4988235", "chrom": "2", "pos": 136608646, "genotype": "AG"},  # LCT
        {"rsid": "rs1042522", "chrom": "17", "pos": 7579472, "genotype": "GG"},   # TP53
    ]
    # Run all analyses
    demo_cfg = {
        "run_traits": True,
        "run_protein": True,
        "run_pgs": True,
        "target_rsid": "rs1042522"  # Focus on TP53
    }
    # Point to backend/data
    demo_paths = {
        "data_dir": os.path.join(os.path.dirname(__file__), "../data")
    }
    
    result = analyze_entry(demo_variants, demo_cfg, demo_paths)
    
    # Pretty print result
    print(json.dumps(result, indent=2))

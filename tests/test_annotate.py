import pytest
from backend.analysis.annotate import join_annotations
from backend.analysis.types import Variant
import os

def test_trait_coverage(tmp_path):
    # Setup paths
    data_dir = os.path.join(os.path.dirname(__file__), '../backend/data')
    paths = {"data_dir": data_dir}
    # Demo variant present
    variants = [
        {"rsid": "rs4988235", "chrom": "2", "pos": 136608646, "genotype": "AG"}
    ]
    annotated, notes = join_annotations(variants, paths)
    # Trait row for rs4988235 should be covered
    trait_rows = [t for t in eval([n for n in notes if n.startswith("Traits details:")][0][15:]) if t["rsid"] == "rs4988235"]
    assert trait_rows and trait_rows[0]["status"] == "covered"
    assert trait_rows[0]["your_genotype"] == "AG"

    # Unknown rsID
    variants = [{"rsid": "rsUNKNOWN", "chrom": "1", "pos": 12345, "genotype": "AA"}]
    annotated, notes = join_annotations(variants, paths)
    trait_rows = [t for t in eval([n for n in notes if n.startswith("Traits details:")][0][15:]) if t["rsid"] == "rsUNKNOWN"]
    assert not trait_rows  # Should not crash

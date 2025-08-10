from backend.analysis.pipeline import run_analysis
from backend.analysis.types import Variant, AnalysisConfig
import os

def test_pipeline_demo():
    data_dir = os.path.join(os.path.dirname(__file__), '../backend/data')
    paths = {"data_dir": data_dir}
    variants = [
        {"rsid": "rs4988235", "chrom": "2", "pos": 136608646, "genotype": "AG"},
        {"rsid": "rs1042522", "chrom": "17", "pos": 7579472, "genotype": "GG"}
    ]
    cfg = {
        "run_traits": True,
        "run_protein": True,
        "run_pgs": True,
        "target_rsid": "rs1042522"
    }
    result = run_analysis(variants, cfg, paths)
    assert "variants" in result
    assert "traits" in result
    assert "protein" in result
    assert "pgs" in result
    assert "notes" in result
    assert result["protein"] is not None
    assert isinstance(result["traits"], list)

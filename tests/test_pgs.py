from backend.analysis.pgs import compute_pgs_bmi
from backend.analysis.utils import dosage_for_effect, normalize_genotype, percentile_from_z
from backend.analysis.types import Variant
import os

def test_dosage_and_percentile():
    assert dosage_for_effect("AG", "A") == 1
    assert dosage_for_effect("GA", "A") == 1
    assert dosage_for_effect("--", "A") == 0
    assert normalize_genotype("GA") == "AG"
    assert percentile_from_z(0.0) == 50
    assert percentile_from_z(-10) == 0
    assert percentile_from_z(10) == 100

def test_pgs_bmi():
    data_dir = os.path.join(os.path.dirname(__file__), '../backend/data')
    paths = {"data_dir": data_dir}
    variants = [
        {"rsid": "rsBMI1", "chrom": "1", "pos": 123, "genotype": "AA"},
        {"rsid": "rsBMI2", "chrom": "2", "pos": 456, "genotype": "--"}
    ]
    result, notes = compute_pgs_bmi(variants, paths)
    assert "z" in result["bmi"]
    assert isinstance(result["bmi"]["percentile"], int)

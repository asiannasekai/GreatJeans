from backend.analysis.protein import build_protein_targets
from backend.analysis.types import Variant
import os

def test_tp53_protein():
    data_dir = os.path.join(os.path.dirname(__file__), '../backend/data')
    paths = {"data_dir": data_dir}
    variants = [
        {"rsid": "rs1042522", "chrom": "17", "pos": 7579472, "genotype": "GG"}
    ]
    protein, notes = build_protein_targets(variants, paths, "rs1042522")
    assert protein is not None
    assert protein["uniprot"] == "P04637"
    assert any(r["index"] == 72 for r in protein["residues"])

from backend.api import make_result_json
import pandas as pd


def test_contract_keys():
    df = pd.DataFrame([
        {'rsid':'rs1042522','chrom':'chr17','pos':7676150,'genotype':'GG'},
        {'rsid':'rs4988235','chrom':'chr2','pos':136608646,'genotype':'CT'}
    ])
    res = make_result_json(df, '23andme', True, True, True)
    top_keys = set(res.model_dump().keys())
    assert {'qc','genome_window','variants','traits','protein','pgs','ai_summary','disclaimer'} <= top_keys
    assert res.qc['format']=='23andme'
    assert res.protein.uniprot=='P04637'

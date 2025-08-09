import pandas as pd
from backend.parser_23andme import parse_23andme, is_23andme_text
from backend.parser_vcf import is_vcf

def test_parse_23andme():
    sample = b"# rsid\tchromosome\tposition\tgenotype\nrs1\t1\t1000\tAA\nrs2\t2\t2000\tCT\n"
    assert is_23andme_text(sample.decode())
    df = parse_23andme(sample)
    assert list(df.columns)==['rsid','chrom','pos','genotype']
    assert len(df)==2


def test_detect_vcf():
    head = b"##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO"
    assert is_vcf(head)

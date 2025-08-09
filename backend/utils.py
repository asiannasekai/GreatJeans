"""Utility helpers for normalization and link building."""
from __future__ import annotations

def normalize_chrom(chrom: str) -> str:
    if not chrom:
        return chrom
    c = chrom.lower().replace('chr','')
    return f"chr{c}"

def normalize_genotype(gt: str | None) -> str:
    if not gt or gt in {"--","NA"}:
        return "--"
    letters = [a for a in gt if a in 'ACGT']
    if not letters:
        return "--"
    if len(letters) == 1:
        letters = letters*2
    return ''.join(sorted(letters[:2]))

def dbsnp_link(rsid: str) -> str:
    return f"https://www.ncbi.nlm.nih.gov/snp/{rsid}"

def ensembl_link(chrom: str, pos: int, rsid: str) -> str:
    return f"https://www.ensembl.org/Homo_sapiens/Variation/Explore?db=core;r={chrom}:{pos}-{pos};v={rsid}"

__all__ = ['normalize_chrom','normalize_genotype','dbsnp_link','ensembl_link']

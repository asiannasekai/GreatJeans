def dbsnp_link(rsid: str) -> str:
    """Return dbSNP link for given rsID."""
    return f"https://www.ncbi.nlm.nih.gov/snp/{rsid}"

def ensembl_link(chrom: str, pos: int, rsid: str) -> str:
    """Return Ensembl link for given variant."""
    return f"https://www.ensembl.org/Homo_sapiens/Variation/Explore?v={rsid}&vdb=variant;vf={chrom}:{pos}"

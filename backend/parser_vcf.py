"""Minimal VCF parser. Uses cyvcf2 if available, else a lightweight fallback.
Returns list of dict variants: {rsid, chrom, pos, genotype}
"""
from __future__ import annotations
from pathlib import Path
from typing import List, Dict
import gzip, io
from .utils import normalize_chrom, normalize_genotype

try:
    from cyvcf2 import VCF  # type: ignore
    HAVE_CYVCF2 = True
except Exception:  # pragma: no cover - optional dep
    HAVE_CYVCF2 = False


def is_vcf(head: bytes) -> bool:
    return head.startswith(b'##fileformat=VCF') or b'\n#CHROM' in head


def parse_vcf(raw_bytes: bytes) -> List[Dict]:
    if HAVE_CYVCF2:
        # Need to feed via temp in-memory file; simplest: write to BytesIO and pass path not supported -> write to temp file.
        import tempfile
        suffix = '.vcf'
        # detect gzip
        if raw_bytes[:2] == b'\x1f\x8b':
            suffix = '.vcf.gz'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name
        variants = []
        try:
            for rec in VCF(tmp_path):  # type: ignore
                rsid = rec.ID or ''
                if not rsid.startswith('rs'):
                    continue
                gt = rec.genotypes[0][:2] if rec.genotypes else []
                geno = ''.join(['.' if a is None or a < 0 else rec.alleles[a] for a in gt])
                variants.append({'rsid': rsid, 'chrom': normalize_chrom(str(rec.CHROM)), 'pos': int(rec.POS), 'genotype': normalize_genotype(geno)})
        finally:
            Path(tmp_path).unlink(missing_ok=True)
        return variants
    # Fallback naive parser
    data = raw_bytes
    if raw_bytes[:2] == b'\x1f\x8b':
        data = gzip.decompress(raw_bytes)
    variants: List[Dict] = []
    for line in data.splitlines():
        if not line or line.startswith(b'#'):
            continue
        parts = line.decode(errors='ignore').split('\t')
        if len(parts) < 8:
            continue
        chrom, pos, vid, ref, alt = parts[:5]
        if not vid.startswith('rs'):
            continue
        # genotype extraction naive: from sample column if present
        sample_cols = parts[8:]
        genotype = 'NA'
        if sample_cols:
            fmt = parts[8].split(':')
            if len(sample_cols) >= 1:
                gt_field = sample_cols[0].split(':')[0]
                genotype = gt_field.replace('|','/').replace('0','ref').replace('1','alt')
    variants.append({'rsid': vid, 'chrom': normalize_chrom(chrom), 'pos': int(pos), 'genotype': normalize_genotype(genotype)})
    return variants

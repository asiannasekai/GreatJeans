"""Parser for 23andMe style raw data text files.
Expected tab-delimited columns: rsid\tchromosome\tposition\tgenotype
Lines beginning with '#' are comments.
Returns pandas DataFrame with columns [rsid, chrom, pos, genotype].
"""
from __future__ import annotations
import pandas as pd
from io import StringIO
from typing import Tuple
from .utils import normalize_chrom, normalize_genotype

EXPECTED_HEADER = ['rsid','chromosome','position','genotype']


def is_23andme_text(head: str) -> bool:
    for line in head.splitlines():
        if line.lower().startswith('#'):
            continue
        parts = line.strip().split('\t')
        if len(parts) == 4 and parts[0].lower() == 'rsid':
            return True
        # Some files just start directly with first data line; heuristics later.
    return '# rsid' in head.lower()


def parse_23andme(raw_bytes: bytes) -> pd.DataFrame:
    text = raw_bytes.decode(errors='ignore')
    lines = text.splitlines()
    # Find header line (can be commented: '# rsid')
    header_idx = None
    cleaned_header = None
    for i, line in enumerate(lines):
        raw = line.strip()
        if not raw:
            continue
        if raw.startswith('#'):
            candidate = raw.lstrip('#').strip()
            if candidate.lower().startswith('rsid'):
                header_idx = i
                cleaned_header = candidate
                break
            continue
        if raw.lower().startswith('rsid'):
            header_idx = i
            cleaned_header = raw
            break
    if header_idx is None:
        raise ValueError('no_data_lines')
    # Collect data lines ensuring header present first
    data_lines = [cleaned_header]
    for line in lines[header_idx+1:]:
        if not line.strip():
            continue
        if line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) >= 4:
            data_lines.append('\t'.join(parts[:4]))
    if not data_lines:
        raise ValueError('no_data_lines')
    df = pd.read_csv(StringIO('\n'.join(data_lines)), sep='\t')
    df.columns = [c.lower() for c in df.columns]
    df.rename(columns={'chromosome':'chrom','position':'pos'}, inplace=True)
    df = df[['rsid','chrom','pos','genotype']]
    df['chrom'] = df['chrom'].astype(str).map(normalize_chrom)
    df['genotype'] = df['genotype'].astype(str).map(normalize_genotype)
    return df

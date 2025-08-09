"""Local annotation joins for traits, ClinVar light, and protein mapping."""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
from .utils import dbsnp_link, ensembl_link, normalize_chrom

DATA_DIR = Path(__file__).parent / 'data'

TRAITS_FILE = DATA_DIR / 'traits_catalog.csv'
CLINVAR_FILE = DATA_DIR / 'clinvar_light.csv'
PROTEIN_FILE = DATA_DIR / 'protein_map.csv'
PGS_FILE = DATA_DIR / 'pgs_bmi_small.csv'


_DEF_TRAIT_COLS = ['rsid','trait','effect_allele','note','model','source_url']


def load_csv_cached(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


_traits_df = load_csv_cached(TRAITS_FILE)
_clinvar_df = load_csv_cached(CLINVAR_FILE)
_protein_df = load_csv_cached(PROTEIN_FILE)
_pgs_df = load_csv_cached(PGS_FILE)


def annotate_variants(df_variants: pd.DataFrame) -> List[Dict[str, Any]]:
    out = []
    clinvar_map = _clinvar_df.set_index('rsid').to_dict(orient='index') if not _clinvar_df.empty else {}
    protein_map = _protein_df.set_index('rsid').to_dict(orient='index') if not _protein_df.empty else {}
    for row in df_variants.itertuples():
        rsid = row.rsid
        gene = None
        consequence = None
        if rsid in protein_map:
            gene = protein_map[rsid].get('gene')
            consequence = 'missense_variant' if protein_map[rsid].get('protein_change') else None
        chrom = normalize_chrom(str(row.chrom))
        links = {
            'dbsnp': dbsnp_link(rsid),
            'ensembl': ensembl_link(chrom, int(row.pos), rsid)
        }
        out.append({
            'rsid': rsid,
            'chrom': chrom,
            'pos': int(row.pos),
            'genotype': row.genotype,
            'gene': gene,
            'consequence': consequence,
            'links': links
        })
    return out


def build_traits_section(df_variants: pd.DataFrame) -> List[Dict[str, Any]]:
    if _traits_df.empty:
        return []
    var_geno = df_variants.set_index('rsid')['genotype'].to_dict()
    rows = []
    for r in _traits_df.itertuples():
        your_geno = var_geno.get(r.rsid)
        status = 'covered' if your_geno else 'missing'
        rows.append({
            'trait': r.trait,
            'rsid': r.rsid,
            'effect_allele': r.effect_allele,
            'your_genotype': your_geno,
            'status': status,
            'source_url': r.source_url
        })
    return rows


def build_protein_block(df_variants: pd.DataFrame):
    if _protein_df.empty:
        return None
    var_set = set(df_variants['rsid'])
    residues = []
    uni = None
    cif = None
    for r in _protein_df.itertuples():
        if r.rsid in var_set:
            uni = r.uniprot
            cif = r.alphafold_cif_url
            residues.append({'rsid': r.rsid, 'index': int(r.residue_index), 'protein_change': r.protein_change})
    if not residues:
        return None
    return {'uniprot': uni, 'alphafold_cif_url': cif, 'residues': residues}


def genome_window(df_variants: pd.DataFrame):
    # prefer TP53 rs1042522
    target = 'rs1042522'
    if target in set(df_variants['rsid']):
        row = df_variants[df_variants['rsid']==target].iloc[0]
        chrom = str(row['chrom'])
        pos = int(row['pos'])
        return {'chrom': chrom, 'start': max(0, pos-25), 'end': pos+25, 'rsid': target}
    # fallback first variant
    if not df_variants.empty:
        row = df_variants.iloc[0]
        chrom = str(row['chrom'])
        pos = int(row['pos'])
        return {'chrom': chrom, 'start': max(0,pos-25), 'end': pos+25, 'rsid': row['rsid']}
    # static fallback
    return {'chrom': 'chr17', 'start': 7676125, 'end': 7676175, 'rsid': 'rs1042522'}

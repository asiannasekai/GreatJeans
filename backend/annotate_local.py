"""Local annotation joins for traits, ClinVar light, and protein mapping."""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
from .utils import dbsnp_link, ensembl_link, normalize_chrom


def annotate_variants(df_variants: pd.DataFrame, catalogs=None) -> List[Dict[str, Any]]:
    out = []
    clinvar_map = catalogs.clinvar.set_index('rsid').to_dict(orient='index') if catalogs and not catalogs.clinvar.empty else {}
    protein_map = catalogs.protein_map.set_index('rsid').to_dict(orient='index') if catalogs and not catalogs.protein_map.empty else {}
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


def build_traits_section(df_variants: pd.DataFrame, catalogs=None) -> List[Dict[str, Any]]:
    if not catalogs or catalogs.traits.empty:
        return []
    var_geno = df_variants.set_index('rsid')['genotype'].to_dict()
    rows = []
    for r in catalogs.traits.itertuples():
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


def build_protein_block(df_variants: pd.DataFrame, catalogs=None, target_rsid: str = None):
    if not catalogs or catalogs.protein_map.empty:
        return None
    var_set = set(df_variants['rsid'])
    residues = []
    uni = None
    cif = None
    
    # Prefer target_rsid if specified and present
    rsid_order = [target_rsid] if target_rsid and target_rsid in var_set else []
    rsid_order.extend([rsid for rsid in var_set if rsid != target_rsid])
    
    for r in catalogs.protein_map.itertuples():
        if r.rsid in rsid_order:
            uni = r.uniprot
            cif = r.alphafold_cif_url
            residues.append({'rsid': r.rsid, 'index': int(r.residue_index), 'protein_change': r.protein_change})
            break  # Take first match
    
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

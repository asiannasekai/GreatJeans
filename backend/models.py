"""Pydantic models and result contract definitions for the genomics API."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UploadResponse(BaseModel):
    upload_id: str
    format: str | None = None

class AnalyzeRequest(BaseModel):
    upload_id: str
    run_traits: bool = True
    run_protein: bool = True
    run_pgs: bool = False
    target_rsid: str | None = None

class GenomeWindow(BaseModel):
    chrom: str
    start: int
    end: int
    rsid: str

class Variant(BaseModel):
    rsid: str
    chrom: str
    pos: int
    genotype: str
    gene: Optional[str] = None
    consequence: Optional[str] = None
    links: Dict[str, str] = Field(default_factory=dict)

class TraitRow(BaseModel):
    trait: str
    rsid: str
    effect_allele: str
    your_genotype: Optional[str] = None
    status: str
    source_url: Optional[str] = None

class ProteinResidue(BaseModel):
    rsid: str
    index: int
    protein_change: Optional[str] = None

class ProteinBlock(BaseModel):
    uniprot: str
    alphafold_cif_url: str
    residues: List[ProteinResidue]

class PGSScore(BaseModel):
    z: float
    percentile: int
    pgs_id: str
    note: str

class ResultJSON(BaseModel):
    qc: Dict[str, Any]
    genome_window: GenomeWindow
    variants: List[Variant]
    traits: List[TraitRow] = Field(default_factory=list)
    protein: Optional[ProteinBlock] = None
    pgs: Optional[Dict[str, PGSScore]] = None
    ai_summary: Dict[str, Any]
    mini_model: Optional[Dict[str, Any]] = None
    disclaimer: Optional[str] = None

__all__ = [
    'UploadResponse','AnalyzeRequest','GenomeWindow','Variant','TraitRow','ProteinResidue',
    'ProteinBlock','PGSScore','ResultJSON'
]

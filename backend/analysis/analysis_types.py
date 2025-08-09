from typing import TypedDict, Optional, List, Dict

class Variant(TypedDict):
    rsid: str
    chrom: str
    pos: int
    genotype: str

class AnalysisConfig(TypedDict):
    run_traits: bool
    run_protein: bool
    run_pgs: bool
    target_rsid: Optional[str]

class AnalysisResult(TypedDict):
    variants: List[Dict]
    traits: List[Dict]
    protein: Optional[Dict]
    pgs: Optional[Dict]
    notes: List[str]

from typing import NamedTuple, Optional

from typing import NamedTuple, List, Dict, Optional, Any
from dataclasses import dataclass

class Variant(NamedTuple):
    rsid: str
    chrom: str
    pos: int
    genotype: str

@dataclass
class AnalysisConfig:
    """Configuration for analysis pipeline"""
    run_pgs: bool = True
    run_protein: bool = True
    run_ss: bool = True
    target_rsid: Optional[str] = None
    
    def get(self, key: str, default=None):
        """Dict-like interface for backward compatibility"""
        return getattr(self, key, default)

@dataclass
class AnalysisResult:
    """Result from analysis pipeline"""
    variants: List[Variant]
    pgs_scores: Optional[Dict[str, Any]] = None
    protein_effects: Optional[Dict[str, Any]] = None
    ss_predictions: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    gene: Optional[str] = None
    consequence: Optional[str] = None

"""Secondary structure prediction stub for demo purposes."""
from __future__ import annotations
from typing import Dict

def predict_secondary_structure(wt_seq: str, mut_seq: str) -> Dict:
    # naive uniform probabilities
    base = {"helix": 0.33, "sheet": 0.33, "coil": 0.34}
    confidence = round(min(0.99, max(0.1, len(wt_seq)/1000)), 2)
    return {
        'wt': {**base, 'confidence': confidence},
        'mut': {**base, 'confidence': confidence},
        'delta': {k: 0 for k in base}
    }

__all__ = ['predict_secondary_structure']

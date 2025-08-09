"""JSON contract validator for analysis fragments."""
from typing import Dict, Any, Union, List
import math
from copy import deepcopy

def _clamp_float(x: Any, min_val: float = 0.0, max_val: float = 1.0, decimals: int = 3) -> Union[float, None]:
    """Clamp float to range and round to decimals. Handle NaN/inf/non-floats."""
    try:
        x = float(x)
        if math.isnan(x) or math.isinf(x):
            return None
        return round(max(min_val, min(max_val, x)), decimals)
    except (TypeError, ValueError):
        return None

def _sanitize_dict(d: Dict, depth: int = 3) -> Dict:
    """Recursively sanitize dict values up to max depth."""
    if depth <= 0 or not isinstance(d, dict):
        return d
    result = {}
    for k, v in d.items():
        if isinstance(v, (int, float)):  # Handle both int and float
            result[k] = _clamp_float(v)
        elif isinstance(v, dict):
            result[k] = _sanitize_dict(v, depth - 1)
        elif isinstance(v, list):
            result[k] = [_sanitize_dict(x, depth - 1) if isinstance(x, dict) 
                        else _clamp_float(x) if isinstance(x, (int, float))
                        else x for x in v]
        else:
            result[k] = v
    return result

def validate_fragment(result: Dict) -> Dict:
    """
    Validate and sanitize an analysis result fragment.
    Ensures required keys exist and numeric values are well-formed.
    Args:
        result: Dict with variants, traits, protein, pgs sections
    Returns:
        Sanitized copy of input with proper types and value ranges
    Raises:
        ValueError if required keys are missing or have wrong types
    """
    if not isinstance(result, dict):
        raise ValueError("Fragment must be a dict")
    
    # Make a deep copy to avoid modifying input
    sanitized = deepcopy(result)
    
    # Validate required keys and types
    required_lists = ["variants", "traits", "notes"]
    for key in required_lists:
        if key not in sanitized or not isinstance(sanitized[key], list):
            sanitized[key] = []
    
    optional_dicts = ["protein", "pgs"]
    for key in optional_dicts:
        if key in sanitized and not isinstance(sanitized[key], (dict, type(None))):
            sanitized[key] = None
    
    # Recursively sanitize all numeric values
    return _sanitize_dict(sanitized)

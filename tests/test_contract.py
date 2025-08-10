import pytest
from backend.analysis.contract import validate_fragment, _clamp_float
import math

def test_clamp_float():
    assert _clamp_float(0.12345) == 0.123
    assert _clamp_float(-1) == 0.0
    assert _clamp_float(2) == 1.0
    assert _clamp_float(math.nan) is None
    assert _clamp_float(math.inf) is None
    assert _clamp_float("not a number") is None
    assert _clamp_float(None) is None

def test_validate_fragment():
    # Messy input
    messy = {
        "variants": [{"rsid": "rs1", "score": -1.5}],
        "traits": None,  # wrong type
        "protein": "invalid",  # wrong type
        "pgs": {
            "bmi": {
                "z": math.nan,
                "percentile": 120,  # out of range
                "confidence": 0.12345  # too many decimals
            }
        },
        "extra_key": "will be preserved"
    }
    
    # Sanitized output
    clean = validate_fragment(messy)
    print("Clean output:", clean)  # Debug print
    assert isinstance(clean["variants"], list)
    assert isinstance(clean["traits"], list)
    assert len(clean["traits"]) == 0  # empty list for wrong type
    assert clean["protein"] is None  # None for wrong type
    assert isinstance(clean["pgs"], dict)
    assert clean["pgs"]["bmi"]["z"] is None  # NaN -> None
    assert clean["pgs"]["bmi"]["percentile"] == 1.0  # clamped to 1.0
    assert clean["pgs"]["bmi"]["confidence"] == 0.123  # rounded
    assert "notes" in clean  # added missing required
    assert clean["extra_key"] == "will be preserved"  # preserved extra
    
    # Empty dict gets defaults
    assert all(k in validate_fragment({}) for k in ["variants", "traits", "notes"])
    
    # Non-dict input
    with pytest.raises(ValueError):
        validate_fragment(None)

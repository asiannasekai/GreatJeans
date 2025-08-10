import math

def normalize_genotype(gt: str) -> str:
    """Sort alleles alphabetically, or return '--' for missing."""
    if not gt or gt == "--":
        return "--"
    return ''.join(sorted(gt.upper()))

def dosage_for_effect(gt: str, effect_allele: str) -> int:
    """Count effect alleles in genotype (order-insensitive)."""
    gt = normalize_genotype(gt)
    if gt == "--":
        return 0
    return gt.count(effect_allele.upper())

def percentile_from_z(z: float) -> int:
    """Convert z-score to percentile (0-100 clamp) using normal CDF."""
    p = 0.5 * (1 + math.erf(z / math.sqrt(2)))
    return max(0, min(100, int(round(p * 100))))

def safe_float(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default

def clamp01(x):
    return max(0.0, min(1.0, safe_float(x)))

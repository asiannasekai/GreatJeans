"""Data catalog loaders with LRU caching."""
from __future__ import annotations
import json
import logging
from pathlib import Path
import pandas as pd
from functools import lru_cache
from typing import Dict, Any
from .config import STORAGE_ROOT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global data directory
_data_dir: Path | None = None

def set_data_dir(data_dir: str | Path | None) -> None:
    """Set the data directory for all catalog functions."""
    global _data_dir
    _data_dir = Path(data_dir) if data_dir is not None else None
    # Clear all caches when data dir changes
    clear_caches()

def _get_data_path(filename: str) -> Path:
    """Get path to a data file."""
    global _data_dir
    if _data_dir is None:
        raise RuntimeError("Data directory not set. Call set_data_dir() first.")
    return _data_dir / filename

def _safe_csv(path: Path) -> pd.DataFrame:
    """Safely load CSV file with logging."""
    if path.exists():
        try:
            logger.info(f"Loading CSV from {path}")
            return pd.read_csv(path)
        except Exception as e:
            logger.error(f"Failed to load {path}: {e}")
            return pd.DataFrame()
    logger.warning(f"File not found: {path}")
    return pd.DataFrame()

def _safe_json(path: Path) -> Dict[str, Any]:
    """Safely load JSON file with logging."""
    if path.exists():
        try:
            logger.info(f"Loading JSON from {path}")
            return json.loads(path.read_text())
        except Exception as e:
            logger.error(f"Failed to load {path}: {e}")
            return {}
    logger.warning(f"File not found: {path}")
    return {}

@lru_cache(maxsize=None)
def get_traits_df() -> pd.DataFrame:
    """Load traits catalog with caching."""
    return _safe_csv(_get_data_path('traits_catalog.csv'))

@lru_cache(maxsize=None)
def get_clinvar_df() -> pd.DataFrame:
    """Load ClinVar data with caching."""
    return _safe_csv(_get_data_path('clinvar_light.csv'))

@lru_cache(maxsize=None)
def get_protein_map_df() -> pd.DataFrame:
    """Load protein mappings with caching."""
    return _safe_csv(_get_data_path('protein_map.csv'))

@lru_cache(maxsize=None)
def get_pgs_df() -> pd.DataFrame:
    """Load PGS catalog with caching."""
    return _safe_csv(_get_data_path('pgs_bmi_small.csv'))

@lru_cache(maxsize=None)
def get_aa_windows() -> Dict[str, Any]:
    """Load amino acid windows with caching."""
    return _safe_json(_get_data_path('aa_windows.json'))

def clear_caches() -> None:
    """Clear all LRU caches."""
    get_traits_df.cache_clear()
    get_clinvar_df.cache_clear()
    get_protein_map_df.cache_clear()
    get_pgs_df.cache_clear()
    get_aa_windows.cache_clear()

__all__ = [
    'set_data_dir',
    'get_traits_df',
    'get_clinvar_df', 
    'get_protein_map_df',
    'get_pgs_df',
    'get_aa_windows',
    'clear_caches'
]

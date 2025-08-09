"""Configuration loader for environment-driven settings."""
from __future__ import annotations
import os
from pathlib import Path

def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
MAX_UPLOAD_MB = _int("MAX_UPLOAD_MB", 20)
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./storage/tmp")).resolve()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

__all__ = [
    'FRONTEND_ORIGIN','MAX_UPLOAD_MB','STORAGE_ROOT','LOG_LEVEL'
]

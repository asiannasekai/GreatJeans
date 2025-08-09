"""Singleton loader for local data catalogs (traits, clinvar, protein_map, pgs, aa_windows)."""
from __future__ import annotations
import json
from pathlib import Path
import pandas as pd
from typing import Optional
from .config import STORAGE_ROOT

class Catalogs:
    _instance: 'Catalogs | None' = None

    def __init__(self, data_dir: str | Path):
        self.data_dir = Path(data_dir)
        self.traits_path = self.data_dir / 'traits_catalog.csv'
        self.clinvar_path = self.data_dir / 'clinvar_light.csv'
        self.protein_map_path = self.data_dir / 'protein_map.csv'
        self.pgs_path = self.data_dir / 'pgs_bmi_small.csv'
        self.aa_windows_path = self.data_dir / 'aa_windows.json'
        self.traits = self._safe_csv(self.traits_path)
        self.clinvar = self._safe_csv(self.clinvar_path)
        self.protein_map = self._safe_csv(self.protein_map_path)
        self.pgs = self._safe_csv(self.pgs_path)
        self.aa_windows = self._safe_json(self.aa_windows_path)

    @staticmethod
    def _safe_csv(path: Path) -> pd.DataFrame:
        if path.exists():
            try:
                return pd.read_csv(path)
            except Exception:
                return pd.DataFrame()
        return pd.DataFrame()

    @staticmethod
    def _safe_json(path: Path):
        if path.exists():
            try:
                return json.loads(path.read_text())
            except Exception:
                return {}
        return {}

    @classmethod
    def load(cls, data_dir: str | Path):
        if cls._instance is None:
            cls._instance = Catalogs(data_dir)
        return cls._instance

    @classmethod
    def instance(cls) -> 'Catalogs':
        if cls._instance is None:
            raise RuntimeError('Catalogs not loaded')
        return cls._instance

__all__ = ['Catalogs']

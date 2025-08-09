import os
import json
from typing import Tuple, Optional

def fetch_window_for_rsid(rsid: str, paths: dict) -> Optional[Tuple[str, str, int]]:
    """
    Fetch amino-acid window for a known rsID from aa_windows.json.
    Returns (wt_seq, mut_seq, center_index) or None if not found.
    """
    data_dir = paths["data_dir"]
    windows_path = os.path.join(data_dir, "aa_windows.json")
    try:
        with open(windows_path, "r") as f:
            windows = json.load(f)
        entry = windows.get(rsid)
        if entry:
            return entry["wt_seq"], entry["mut_seq"], entry["center_index"]
    except Exception:
        pass
    return None

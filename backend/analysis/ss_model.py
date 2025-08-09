"""Secondary structure prediction stub for demo purposes.
Time complexity: O(L) for window length L.
"""
from __future__ import annotations
from typing import Dict
import random
try:
    import numpy as np
    np.random.seed(0)
except ImportError:
    pass
random.seed(0)

def predict_secondary_structure(wt_seq: str, mut_seq: str) -> Dict:
    import os
    import math
    import time
    t0 = time.time()
    # Model cache
    if not hasattr(predict_secondary_structure, "_model_loaded"):
        predict_secondary_structure._model = None
        predict_secondary_structure._model_loaded = False
        predict_secondary_structure._model_path = None
        # Try to find model file
        for ext in (".joblib", ".pt"):
            candidate = os.path.join(os.path.dirname(__file__), "../data/ss_head" + ext)
            if os.path.exists(candidate):
                predict_secondary_structure._model_path = candidate
                break
    def _load_model():
        if predict_secondary_structure._model_loaded:
            return predict_secondary_structure._model
        path = predict_secondary_structure._model_path
        if path:
            try:
                if path.endswith(".joblib"):
                    import joblib
                    predict_secondary_structure._model = joblib.load(path)
                elif path.endswith(".pt"):
                    import torch
                    predict_secondary_structure._model = torch.load(path, map_location="cpu")
                predict_secondary_structure._model_loaded = True
            except Exception:
                predict_secondary_structure._model = None
                predict_secondary_structure._model_loaded = True
        return predict_secondary_structure._model
    def _featurize(seq: str) -> list:
        aa = "ACDEFGHIKLMNPQRSTVWY"
        vec = [0] * len(aa)
        for c in seq:
            if c in aa:
                vec[aa.index(c)] += 1
        return vec
    def _softmax(x):
        e_x = [math.exp(i) for i in x]
        s = sum(e_x)
        return [v/s for v in e_x]
    def _entropy(probs):
        return -sum(p * math.log(p+1e-9) for p in probs)
    window = {"center": len(wt_seq)//2, "length": len(wt_seq)}
    notes = []
    model = _load_model()
    classes = ["helix", "sheet", "coil"]
    def predict(seq):
        if model:
            try:
                if hasattr(model, "predict_proba"):
                    feats = _featurize(seq)
                    probs = model.predict_proba([feats])[0]
                elif hasattr(model, "__call__"):
                    import torch
                    feats = torch.tensor(_featurize(seq), dtype=torch.float32).unsqueeze(0)
                    logits = model(feats).detach().numpy()[0]
                    probs = _softmax(logits)
                else:
                    raise Exception("Unknown model type")
                conf = 1 - _entropy(probs)/math.log(len(classes))
                return dict(zip(classes, probs)), conf
            except Exception:
                pass
        # Fallback: uniform
        probs = [1/3]*3
        conf = 0.1
        notes.append("ss_model_unavailable")
        return dict(zip(classes, probs)), conf
    wt_probs, wt_conf = predict(wt_seq)
    mut_probs, mut_conf = predict(mut_seq)
    delta = {k: mut_probs[k] - wt_probs[k] for k in classes}
    result = {
        "window": window,
        "wt": {**wt_probs, "confidence": wt_conf},
        "mut": {**mut_probs, "confidence": mut_conf},
        "delta": delta
    }
    if notes:
        result["notes"] = notes
    return result

__all__ = ['predict_secondary_structure']

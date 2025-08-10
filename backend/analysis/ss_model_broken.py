<<<<<<< HEAD
"""ESM-lite: Position-specific secondary structure prediction with learned features.

This module implements a hackathon-friendly "ESM-lite" approach that provides:
- Position-specific context via sliding windows
- Per-residue predictions 
- Learned representations via small MLP
- Fast CPU-only inference

The model uses hand-crafted features (one-hot AA, physicochemical properties, BLOSUM62)
combined with context pooling and a small neural network trained on mini-DSSP data.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Any
import pickle
import os

# Amino acid properties and encoding
AA_ORDER = 'ACDEFGHIKLMNPQRSTVWY'
AA_TO_IDX = {aa: i for i, aa in enumerate(AA_ORDER)}

# Physicochemical properties (normalized -1 to 1)
PHYSICO_PROPS = {
    'A': [1.8, 0, 0, 89, 0, 0, 0],   # hydropathy, charge, polarity, mass, aromatic, isPro, isGly
    'C': [2.5, 0, 0, 121, 0, 0, 0],
    'D': [-3.5, -1, 1, 133, 0, 0, 0],
    'E': [-3.5, -1, 1, 147, 0, 0, 0],
    'F': [2.8, 0, 0, 165, 1, 0, 0],
    'G': [-0.4, 0, 0, 75, 0, 0, 1],
    'H': [-3.2, 0.5, 1, 155, 1, 0, 0],
    'I': [4.5, 0, 0, 131, 0, 0, 0],
    'K': [-3.9, 1, 1, 146, 0, 0, 0],
    'L': [3.8, 0, 0, 131, 0, 0, 0],
    'M': [1.9, 0, 0, 149, 0, 0, 0],
    'N': [-3.5, 0, 1, 132, 0, 0, 0],
    'P': [-1.6, 0, 0, 115, 0, 1, 0],
    'Q': [-3.5, 0, 1, 146, 0, 0, 0],
    'R': [-4.5, 1, 1, 174, 0, 0, 0],
    'S': [-0.8, 0, 1, 105, 0, 0, 0],
    'T': [-0.7, 0, 1, 119, 0, 0, 0],
    'V': [4.2, 0, 0, 117, 0, 0, 0],
    'W': [-0.9, 0, 0, 204, 1, 0, 0],
    'Y': [-1.3, 0, 1, 181, 1, 0, 0],
}

# Simplified BLOSUM62 rows (normalized)
BLOSUM62 = {
    'A': [4, -1, -2, -2, 0, -1, -1, 0, -2, -1, -1, -1, -1, -2, -1, 1, 0, -3, -2, 0],
    'C': [-1, 9, -3, -4, -2, -3, -3, -1, -3, -1, -1, -3, -3, -3, -3, -1, -1, -2, -2, -1],
    'D': [-2, -3, 6, 2, -3, -1, -1, -3, -1, -4, -3, 1, -1, 0, -2, 0, -1, -4, -3, -3],
    'E': [-2, -4, 2, 5, -3, -2, 0, -3, 1, -3, -2, 0, -1, 2, 0, 0, -1, -3, -2, -2],
    'F': [0, -2, -3, -3, 6, -3, -1, 0, -3, 0, 0, -3, -4, -3, -3, -2, -2, 1, 3, -1],
    'G': [-1, -3, -1, -2, -3, 6, -2, 0, -2, -4, -4, -2, -3, -2, -2, 0, -2, -2, -3, -3],
    'H': [-1, -3, -1, 0, -1, -2, 8, -3, -1, -3, -2, 1, -2, 0, 0, -1, -2, -2, 2, -3],
    'I': [0, -1, -3, -3, 0, 0, -3, 4, -3, 2, 1, -3, -3, -3, -3, -2, -1, -3, -1, 3],
    'K': [-2, -3, -1, 1, -3, -2, -1, -3, 5, -2, -1, 0, -1, 1, 2, 0, -1, -3, -2, -2],
    'L': [-1, -1, -4, -3, 0, -4, -3, 2, -2, 4, 2, -3, -3, -2, -2, -2, -1, -2, -1, 1],
    'M': [-1, -1, -3, -2, 0, -4, -2, 1, -1, 2, 5, -2, -2, 0, -1, -1, -1, -1, -1, 1],
    'N': [-1, -3, 1, 0, -3, -2, 1, -3, 0, -3, -2, 6, -2, 0, 0, 1, 0, -4, -2, -3],
    'P': [-1, -3, -1, -1, -4, -3, -2, -3, -1, -3, -2, -2, 7, -1, -2, -1, -1, -4, -3, -2],
    'Q': [-2, -3, 0, 2, -3, -2, 0, -3, 1, -2, 0, 0, -1, 5, 1, 0, -1, -2, -1, -2],
    'R': [-1, -3, -2, 0, -3, -2, 0, -3, 2, -2, -1, 0, -2, 1, 5, -1, -1, -3, -2, -3],
    'S': [1, -1, 0, 0, -2, 0, -1, -2, 0, -2, -1, 1, -1, 0, -1, 4, 1, -3, -2, -2],
    'T': [0, -1, -1, -1, -2, -2, -2, -1, -1, -1, -1, 0, -1, -1, -1, 1, 5, -2, -2, 0],
    'V': [-3, -2, -4, -3, 1, -2, -2, -3, -3, -2, -1, -4, -4, -2, -3, -3, -2, 11, 2, -3],
    'W': [-2, -2, -3, -2, 3, -3, 2, -1, -2, -1, -1, -2, -3, -1, -2, -2, -2, 2, 7, -1],
    'Y': [0, -1, -3, -2, -1, -3, -3, 3, -2, 1, 1, -3, -2, -2, -3, -2, 0, -3, -1, 4],
}

class ESMLiteModel:
    """Lightweight secondary structure predictor with learned features."""
    
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.model = None
        self._load_or_train_model()
    
    def _load_or_train_model(self):
        """Load existing model or train a new one."""
        model_path = self.data_dir / 'ss_head.joblib'
        
        if model_path.exists():
            try:
                import joblib
                model_data = joblib.load(model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                return
            except Exception:
                pass
        
        # Train new model
        self._train_model()
    
    def _train_model(self):
        """Train a simple MLP on the mini-DSSP data."""
        try:
            import joblib
            from sklearn.neural_network import MLPClassifier
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            # Fallback to simple logistic regression without sklearn
            self._train_simple_model()
            return
        
        # Load training data
        train_path = self.data_dir / 'ss_train.csv'
        if not train_path.exists():
            self._train_simple_model()
            return
        
        df = pd.read_csv(train_path)
        
        # Extract features and labels
        X, y = [], []
        for _, row in df.iterrows():
            seq = row['sequence']
            labels = row['labels']
            
            for i, (aa, label) in enumerate(zip(seq, labels)):
                features = self._extract_position_features(seq, i)
                X.append(features)
                y.append(label)
        
        X = np.array(X)
        y = np.array(y)
        
        # Train scaler and model
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        self.model = MLPClassifier(
            hidden_layer_sizes=(128,),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        
        # Save model
        model_data = {
            'model': self.model,
            'scaler': self.scaler
        }
        joblib.dump(model_data, self.data_dir / 'ss_head.joblib')
    
    def _train_simple_model(self):
        """Fallback training without sklearn."""
        # Simple probability lookup based on amino acid type
        self.model = 'simple'
        self.aa_probs = {
            'H': {'H': 0.7, 'E': 0.2, 'C': 0.1},  # Helix formers
            'E': {'H': 0.7, 'E': 0.2, 'C': 0.1},
            'L': {'H': 0.6, 'E': 0.3, 'C': 0.1},
            'A': {'H': 0.6, 'E': 0.3, 'C': 0.1},
            'M': {'H': 0.6, 'E': 0.3, 'C': 0.1},
            
            'V': {'H': 0.1, 'E': 0.8, 'C': 0.1},  # Sheet formers
            'I': {'H': 0.1, 'E': 0.8, 'C': 0.1},
            'Y': {'H': 0.1, 'E': 0.7, 'C': 0.2},
            'F': {'H': 0.1, 'E': 0.7, 'C': 0.2},
            'W': {'H': 0.1, 'E': 0.7, 'C': 0.2},
            
            'G': {'H': 0.1, 'E': 0.1, 'C': 0.8},  # Coil formers
            'P': {'H': 0.1, 'E': 0.1, 'C': 0.8},
            'S': {'H': 0.2, 'E': 0.2, 'C': 0.6},
            'D': {'H': 0.2, 'E': 0.2, 'C': 0.6},
            'N': {'H': 0.2, 'E': 0.2, 'C': 0.6},
        }
        # Default for other amino acids
        for aa in AA_ORDER:
            if aa not in self.aa_probs:
                self.aa_probs[aa] = {'H': 0.33, 'E': 0.33, 'C': 0.34}
    
    def _extract_position_features(self, sequence: str, position: int, window_size: int = 7) -> np.ndarray:
        """Extract features for a single position with context window."""
        seq_len = len(sequence)
        features = []
        
        # Extract context window around position
        half_window = window_size // 2
        start = max(0, position - half_window)
        end = min(seq_len, position + half_window + 1)
        
        # Pad if necessary
        context = sequence[start:end]
        if len(context) < window_size:
            # Pad with 'X' (unknown)
            pad_left = max(0, half_window - position)
            pad_right = max(0, position + half_window + 1 - seq_len)
            context = 'X' * pad_left + context + 'X' * pad_right
        
        # Extract features for each position in window
        for i, aa in enumerate(context):
            # One-hot encoding (20 dims)
            one_hot = [0.0] * 20
            if aa in AA_TO_IDX:
                one_hot[AA_TO_IDX[aa]] = 1.0
            features.extend(one_hot)
            
            # Physicochemical properties (7 dims) 
            props = PHYSICO_PROPS.get(aa, [0.0] * 7)
            features.extend(props)
            
            # BLOSUM62 row (20 dims)
            blosum = BLOSUM62.get(aa, [0.0] * 20)
            features.extend(blosum)
        
        # Add context pooling features (mean/std over window)
        window_features = np.array(features).reshape(window_size, -1)
        mean_features = np.mean(window_features, axis=0)
        std_features = np.std(window_features, axis=0)
        features.extend(mean_features.tolist())
        features.extend(std_features.tolist())
        
        return np.array(features)
    
    def predict_position(self, sequence: str, position: int) -> Dict[str, float]:
        """Predict secondary structure for a single position."""
        if self.model == 'simple':
            # Use simple lookup
            aa = sequence[position] if position < len(sequence) else 'X'
            probs = self.aa_probs.get(aa, {'H': 0.33, 'E': 0.33, 'C': 0.34})
            
            # Add some context influence
            context_influence = 0.0
            for offset in [-2, -1, 1, 2]:
                ctx_pos = position + offset
                if 0 <= ctx_pos < len(sequence):
                    ctx_aa = sequence[ctx_pos]
                    if ctx_aa in ['H', 'E', 'L', 'A']:  # Helix formers
                        context_influence += 0.05
                    elif ctx_aa in ['P', 'G']:  # Helix breakers
                        context_influence -= 0.1
            
            # Adjust probabilities based on context
            h_prob = max(0.05, min(0.9, probs['H'] + context_influence))
            c_prob = max(0.05, min(0.9, probs['C'] - context_influence/2))
            e_prob = 1.0 - h_prob - c_prob
            
            return {'H': h_prob, 'E': max(0.05, e_prob), 'C': c_prob}
        
        else:
            # Use trained model
            features = self._extract_position_features(sequence, position)
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            probs = self.model.predict_proba(features_scaled)[0]
            
            # Map to H/E/C order
            classes = self.model.classes_
            prob_dict = {}
            for i, cls in enumerate(classes):
                prob_dict[cls] = float(probs[i])
            
            # Ensure all classes present
            for cls in ['H', 'E', 'C']:
                if cls not in prob_dict:
                    prob_dict[cls] = 0.1
            
            return prob_dict
    
    def predict_sequence(self, sequence: str) -> List[Dict[str, Any]]:
        """Predict secondary structure for entire sequence."""
        results = []
        
        for i in range(len(sequence)):
            probs = self.predict_position(sequence, i)
            
            # Calculate confidence as max probability
            confidence = max(probs.values())
            
            results.append({
                'position': i,
                'aa': sequence[i],
                'probs': probs,
                'confidence': round(confidence, 3)
            })
        
        return results


def predict_secondary_structure_esm_lite(wt_seq: str, mut_seq: str, data_dir: Path) -> Dict[str, Any]:
    """ESM-lite secondary structure prediction with per-residue outputs."""
    
    model = ESMLiteModel(data_dir)
    
    # Get per-residue predictions
    wt_results = model.predict_sequence(wt_seq)
    mut_results = model.predict_sequence(mut_seq)
    
    # Calculate center position (where mutation likely occurred)
    center_pos = len(wt_seq) // 2
    
    # Get center residue predictions
    wt_center = wt_results[center_pos] if center_pos < len(wt_results) else wt_results[-1]
    mut_center = mut_results[center_pos] if center_pos < len(mut_results) else mut_results[-1]
    
    # Calculate deltas
    delta = {
        'helix': round(mut_center['probs']['H'] - wt_center['probs']['H'], 3),
        'sheet': round(mut_center['probs']['E'] - wt_center['probs']['E'], 3),
        'coil': round(mut_center['probs']['C'] - wt_center['probs']['C'], 3)
    }
    
    # Calculate overall confidence
    wt_confidence = np.mean([r['confidence'] for r in wt_results])
    mut_confidence = np.mean([r['confidence'] for r in mut_results])
    
    return {
        'wt': {
            'helix': round(wt_center['probs']['H'], 3),
            'sheet': round(wt_center['probs']['E'], 3),
            'coil': round(wt_center['probs']['C'], 3),
            'confidence': round(float(wt_confidence), 3)
        },
        'mut': {
            'helix': round(mut_center['probs']['H'], 3),
            'sheet': round(mut_center['probs']['E'], 3), 
            'coil': round(mut_center['probs']['C'], 3),
            'confidence': round(float(mut_confidence), 3)
        },
        'delta': delta,
        'per_residue': [
            {
                'i': i,
                'wt': {
                    'H': round(wt_results[i]['probs']['H'], 3) if i < len(wt_results) else 0.33,
                    'E': round(wt_results[i]['probs']['E'], 3) if i < len(wt_results) else 0.33,
                    'C': round(wt_results[i]['probs']['C'], 3) if i < len(wt_results) else 0.34
                },
                'mut': {
                    'H': round(mut_results[i]['probs']['H'], 3) if i < len(mut_results) else 0.33,
                    'E': round(mut_results[i]['probs']['E'], 3) if i < len(mut_results) else 0.33,
                    'C': round(mut_results[i]['probs']['C'], 3) if i < len(mut_results) else 0.34
                }
            }
            for i in range(max(len(wt_seq), len(mut_seq)))
        ]
=======
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
>>>>>>> d5867e653951b91e36b0d36d96d2320ec1b2af3b
    }
    if notes:
        result["notes"] = notes
    return result


# Backward compatibility wrapper
def predict_secondary_structure(wt_seq: str, mut_seq: str) -> Dict:
    """Backward compatible wrapper that uses ESM-lite when available."""
    try:
        # Try to use ESM-lite
        data_dir = Path(__file__).parent.parent / 'data'
        return predict_secondary_structure_esm_lite(wt_seq, mut_seq, data_dir)
    except Exception:
        # Fallback to previous implementation
        from typing import Dict
        
        def _sequence_based_probs(seq: str) -> Dict[str, float]:
            helix_props = {'A': 1.42, 'E': 1.51, 'L': 1.21, 'M': 1.45, 'Q': 1.11, 'K': 1.16, 'R': 0.98}
            sheet_props = {'V': 1.70, 'I': 1.60, 'Y': 1.47, 'F': 1.38, 'W': 1.37, 'L': 1.30, 'T': 1.19}
            coil_props = {'G': 0.57, 'P': 0.57, 'S': 0.77, 'D': 1.01, 'N': 0.67, 'C': 1.19}
            
            h_score = sum(helix_props.get(aa, 1.0) for aa in seq) / len(seq)
            s_score = sum(sheet_props.get(aa, 1.0) for aa in seq) / len(seq)  
            c_score = sum(coil_props.get(aa, 1.0) for aa in seq) / len(seq)
            
            total = h_score + s_score + c_score
            return {
                'helix': round(h_score / total, 3),
                'sheet': round(s_score / total, 3), 
                'coil': round(c_score / total, 3)
            }
        
        def _sequence_confidence(seq: str) -> float:
            flexible_aas = set('GPSDN')
            rigid_aas = set('IVLFW')
            
            flexible_count = sum(1 for aa in seq if aa in flexible_aas)
            rigid_count = sum(1 for aa in seq if aa in rigid_aas)
            
            base_conf = 0.65 + (rigid_count - flexible_count) * 0.02
            return round(max(0.45, min(0.92, base_conf)), 2)
        
        wt_probs = _sequence_based_probs(wt_seq)
        mut_probs = _sequence_based_probs(mut_seq)
        
        delta = {
            'helix': round(mut_probs['helix'] - wt_probs['helix'], 3),
            'sheet': round(mut_probs['sheet'] - wt_probs['sheet'], 3), 
            'coil': round(mut_probs['coil'] - wt_probs['coil'], 3)
        }
        
        return {
            'wt': {**wt_probs, 'confidence': _sequence_confidence(wt_seq)},
            'mut': {**mut_probs, 'confidence': _sequence_confidence(mut_seq)},
            'delta': delta
        }


__all__ = ['predict_secondary_structure', 'predict_secondary_structure_esm_lite', 'ESMLiteModel']

__all__ = ['predict_secondary_structure']

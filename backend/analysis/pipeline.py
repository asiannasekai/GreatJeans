from .types import Variant, AnalysisConfig, AnalysisResult
from .annotate import join_annotations
from .protein import build_protein_targets
from .pgs import compute_pgs_bmi
from .windows import fetch_window_for_rsid
from .ss_model import predict_secondary_structure

def run_analysis(variants: list[Variant], cfg: AnalysisConfig, paths: dict) -> AnalysisResult:
    """
    Orchestrate Winsly’s analysis pipeline.
    Time complexity: O(N+M+K) for N variants, M traits, K protein rows.
    """
    import time
    t0 = time.time()
    notes = []
    # 1) Join annotations (variants + traits)
    try:
        annotated_variants, join_notes = join_annotations(variants, paths)
        notes.extend(join_notes)
    except Exception as e:
        annotated_variants = [dict(v) for v in variants]
        notes.append(f"join_annotations_error: {e}")
    # 2) Protein target (if cfg.run_protein)
    protein = None
    protein_notes = []
    if cfg.get("run_protein", False):
        try:
            protein, protein_notes = build_protein_targets(variants, paths, cfg.get("target_rsid"))
            notes.extend(protein_notes)
        except Exception as e:
            notes.append(f"protein_error: {e}")
    # 3) SS mini-model (if protein + aa window available)
    ss_result = None
    if protein and protein.get("residues"):
        try:
            # Use first residue's rsid
            rsid = protein["residues"][0]["rsid"]
            win = fetch_window_for_rsid(rsid, paths)
            if win:
                wt_seq, mut_seq, center_index = win
                ss_result = predict_secondary_structure(wt_seq, mut_seq)
                protein["ss"] = ss_result
            else:
                notes.append(f"ss_window_missing:{rsid}")
        except Exception as e:
            notes.append(f"ss_model_error: {e}")
    # 4) PGS (if cfg.run_pgs)
    pgs = None
    if cfg.get("run_pgs", False):
        try:
            pgs, pgs_notes = compute_pgs_bmi(variants, paths)
            notes.extend(pgs_notes)
        except Exception as e:
            notes.append(f"pgs_error: {e}")
    # 5) Collect traits from join_annotations notes
    traits = None
    for n in notes:
        if n.startswith("Traits details: "):
            try:
                traits = eval(n[len("Traits details: "):])
            except Exception:
                traits = []
            break
    if traits is None:
        traits = []
    notes.append(f"timing:run_analysis:{(time.time()-t0)*1000:.1f}ms")
    return {
        "variants": annotated_variants,
        "traits": traits,
        "protein": protein,
        "pgs": pgs,
        "notes": notes
    }

import json
from explainer.llm_explainer import explain_with_llm

def test_lengths_and_stats():
    # toy: 10 residues: HHHHH EEEEE
    pred = {
        "seq_id": "t1",
        "sequence": "M"*10,
        "labels":   "HHHHHEEEEE",
        "probs": [[0.9,0.05,0.05]]*5 + [[0.05,0.9,0.05]]*5
    }
    out = explain_with_llm(pred)
    assert out["stats"]["length"] == 10
    assert out["stats"]["percent_helix"] == 50.0
    assert out["stats"]["percent_sheet"] == 50.0
    assert "disclaimer" in out

from backend.analysis.ss_model import predict_secondary_structure

def test_ss_model_fallback():
    wt_seq = "ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMNPQ"
    mut_seq = "ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMNPQ"
    result = predict_secondary_structure(wt_seq, mut_seq)
    assert set(result["wt"]).issuperset({"helix", "sheet", "coil", "confidence"})
    assert set(result["mut"]).issuperset({"helix", "sheet", "coil", "confidence"})
    assert set(result["delta"]).issuperset({"helix", "sheet", "coil"})
    assert "notes" in result and "ss_model_unavailable" in result["notes"]
    assert result["wt"]["confidence"] < 0.5

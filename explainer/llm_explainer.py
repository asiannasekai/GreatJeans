import os, json, re
from typing import Dict, Any, List

def _hf_generate_json(model: str, token: str, system: str, user: str) -> dict:
    from huggingface_hub import InferenceClient
    client = InferenceClient(model=model, token=token)
# -----------------------
# Constants & Prompts
# -----------------------
DISCLAIMER = "Educational use only. Not medical or clinical advice."

SYSTEM_PROMPT = (
    "You are a scientific explainer for protein secondary structure outputs (H/E/C). "
    "ONLY use the provided fields. Do not infer function, binding, disease, or clinical claims. "
    "Be concise, precise, cautious. Summary must be 120–150 words and use 1‑based residue indices. "
    "Include exactly 3 caveats: (1) secondary structure ≠ full 3D fold, "
    "(2) regional/coverage limits (e.g., flexible loops), (3) non‑medical use. "
    "If IDs are provided, add sources for UniProt/PDB/AlphaFold DB/SCOPe. "
    "If rate‑limited or fields are missing, degrade gracefully. "
    "Always return VALID JSON in the requested schema."
)

USER_RULES = (
    "Rules:\n"
    "- Identify contiguous H/E segments ≥5 aa; compute confidence (mean prob: high ≥0.75; medium 0.55–0.74; low <0.55).\n"
    "- Compute % helix/sheet/coil.\n"
    "- If IDs (UniProt/PDB/AlphaFold DB/SCOPe) are provided, mention them succinctly at the end of the summary.\n"
    "- Write a 120–150 word plain-English summary referencing 1–3 key segments with indices.\n"
    "- Return EXACTLY the fields: seq_id, summary_150, segments[], stats{}, caveats[3], sources[], disclaimer.\n"
    "- No function/binding/clinical statements."
)

# -----------------------
# Helpers
# -----------------------
def _percentages(labels: str) -> Dict[str, float]:
    n = len(labels) or 1
    return {
        "length": n,
        "percent_helix": round(100 * labels.count("H") / n, 1),
        "percent_sheet": round(100 * labels.count("E") / n, 1),
        "percent_coil":  round(100 * labels.count("C") / n, 1),
    }

def _segments(labels: str, probs: List[List[float]]) -> List[Dict[str, Any]]:
    segs: List[Dict[str, Any]] = []
    n = len(labels)
    i = 0
    while i < n:
        t = labels[i]
        j = i
        while j < n and labels[j] == t:
            j += 1
        length = j - i
        if t in ("H", "E") and length >= 5:
            idx = 0 if t == "H" else 1
            mean_conf = sum(probs[k][idx] for k in range(i, j)) / length
            conf = "high" if mean_conf >= 0.75 else "medium" if mean_conf >= 0.55 else "low"
            note = "contiguous helix" if t == "H" else "β‑strand cluster"
            segs.append({"start": i+1, "end": j, "type": t, "confidence": conf, "note": note})
        i = j
    return segs

def _trim_150_words(text: str) -> str:
    words = text.split()
    if len(words) <= 150:
        return text
    return " ".join(words[:150])

def _exact_three_caveats() -> List[str]:
    return [
        "Secondary structure provides a coarse view and is not a full 3D fold.",
        "Confidence varies by region; flexible or disordered loops are especially uncertain.",
        "Educational use only. Not medical or clinical advice.",
    ]

def _sources_from_ids(ids: Dict[str, str] | None) -> List[Dict[str, str]]:
    if not ids:
        return []
    mapping = {"uniprot": "UniProt", "pdb": "PDB", "alphafolddb": "AlphaFold DB", "scope": "SCOPe"}
    out: List[Dict[str, str]] = []
    for k, v in ids.items():
        if v:
            out.append({"label": mapping.get(k, k), "id": v})
    return out

def _inline_source_phrase(ids: Dict[str, str] | None) -> str:
    if not ids:
        return ""
    parts = []
    if ids.get("uniprot"):      parts.append(f"UniProt {ids['uniprot']}")
    if ids.get("pdb"):          parts.append(f"PDB {ids['pdb']}")
    if ids.get("alphafolddb"):  parts.append(f"AlphaFold DB {ids['alphafolddb']}")
    if ids.get("scope"):        parts.append(f"SCOPe {ids['scope']}")
    return " Sources: " + ", ".join(parts) + "."

# -----------------------
# Fallback (no LLM)
# -----------------------
def _rule_based_summary_v2(pred: Dict[str, Any]) -> Dict[str, Any]:
    seq_id = pred.get("seq_id", "unknown")
    labels = pred["labels"]
    probs = pred["probs"]
    stats = _percentages(labels)
    segs = _segments(labels, probs)

    seg_txt = (
        "; ".join([
            f"{'helix' if s['type']=='H' else 'β‑sheet'} {s['start']}-{s['end']} ({s['confidence']})"
            for s in segs[:3]
        ]) or "No long helix/β‑sheet segments detected."
    )
    source_phrase = _inline_source_phrase(pred.get("ids"))
    base = (
        f"This sequence shows {stats['percent_helix']}% helix, "
        f"{stats['percent_sheet']}% β‑sheet, and {stats['percent_coil']}% coil. "
        f"{seg_txt} Predictions reflect local patterns in the amino-acid sequence; "
        "confidence is typically higher in long, contiguous segments and lower in loop-like coil regions. "
        "Use these results to triage constructs or guide follow-up experiments, focusing on the most stable segments first."
        f"{source_phrase}"
    )
    summary_150 = _trim_150_words(base)

    return {
        "seq_id": seq_id,
        "summary_150": summary_150,
        "segments": segs,
        "stats": stats,
        "caveats": _exact_three_caveats(),
        "sources": _sources_from_ids(pred.get("ids")),
        "disclaimer": DISCLAIMER,
    }

# -----------------------
# HF call + JSON guardrails
# -----------------------
def _hf_generate_json(model: str, token: str, system: str, user: str) -> Dict[str, Any]:
    client = InferenceClient(model=model, token=token)
    # Build a single prompt (most HF instruct models accept plain text)
    prompt = f"<<SYS>>{system}<<SYS>>\n\n<<USER>>{user}<<USER>>\n\nReturn ONLY JSON."
    text = client.text_generation(
        prompt,
        max_new_tokens=600,
        temperature=0.2,
        top_p=0.9,
        repetition_penalty=1.1,
        do_sample=False,
        return_full_text=False,
    )
    # Try strict JSON parse
    try:
        return json.loads(text)
    except Exception:
        # Try to extract the first JSON object from the text
        m = re.search(r'\{.*\}', text, flags=re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        # If still not JSON, raise to trigger fallback
        raise ValueError(f"Non-JSON from HF: {text[:200]}...")

# -----------------------
# Main entry
# -----------------------
def explain_with_llm(pred: Dict[str, Any]) -> Dict[str, Any]:
    """
    pred schema:
      { seq_id, sequence, labels, probs, ids? }
    returns schema:
      { seq_id, summary_150, segments[], stats{}, caveats[3], sources[], disclaimer }
    """
    # If no HF token or model, use fallback
    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    model = os.getenv("LLM_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
    if not hf_token or model.lower().startswith("gpt-"):
        # No token OR user accidentally set an OpenAI model name → fallback
        return _rule_based_summary_v2(pred)

    # Precompute safe, deterministic parts
    labels = pred["labels"]
    probs = pred["probs"]
    stats = _percentages(labels)
    segs = _segments(labels, probs)
    payload = {
        "seq_id": pred.get("seq_id", "unknown"),
        "sequence": pred["sequence"],
        "labels": labels,
        "segments_precomputed": segs,
        "stats": stats,
        "ids": pred.get("ids", {})
    }

    user = f"Given this prediction JSON, produce an interpretation:\n{json.dumps(payload)}\n{USER_RULES}"
    try:
        data = _hf_generate_json(model, hf_token, SYSTEM_PROMPT, user)
        # Ensure required fields exist
        data.setdefault("seq_id", payload["seq_id"])
        data.setdefault("disclaimer", DISCLAIMER)
        # Light sanity: if missing key fields, fall back
        required = ["summary_150", "segments", "stats", "caveats", "sources", "disclaimer"]
        if not all(k in data for k in required):
            return _rule_based_summary_v2(pred)
        return data
    except Exception:
        return _rule_based_summary_v2(pred)

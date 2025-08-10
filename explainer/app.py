from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from .llm_explainer import explain_with_llm
from dotenv import load_dotenv
load_dotenv()


class Prediction(BaseModel):
    seq_id: str
    sequence: str
    labels: str
    probs: List[List[float]]
    notes: Optional[Dict[str, Any]] = None
    ids: Optional[Dict[str, str]] = None  # <-- NEW: for UniProt/PDB/etc.
    model_config = ConfigDict(extra="ignore")

app = FastAPI(title="Mini AlphaFold LLM Explainer")

@app.get("/healthz")
def health():
    return {"ok": True}

@app.get("/health")
def health_check():
    return {"ok": True}

@app.post("/explain")
def explain(pred: Prediction):
    if len(pred.sequence) != len(pred.labels) or len(pred.sequence) != len(pred.probs):
        raise HTTPException(status_code=400, detail="Length mismatch between sequence, labels, and probabilities.")
    return explain_with_llm(pred.model_dump())

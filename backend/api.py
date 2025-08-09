"""FastAPI application for GreatJeans demo genomics service."""
from __future__ import annotations
import time, logging, uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from .models import UploadResponse, AnalyzeRequest, ResultJSON
from . import storage
from .parser_23andme import parse_23andme, is_23andme_text
from .parser_vcf import parse_vcf, is_vcf
from .annotate_local import annotate_variants, build_traits_section, build_protein_block, genome_window
from .pgs_calc import compute_bmi_pgs
from .config import FRONTEND_ORIGIN, LOG_LEVEL
from .analysis.ss_model import predict_secondary_structure
from .catalogs import Catalogs
from .utils import dbsnp_link, ensembl_link
import os, json

logging.basicConfig(level=LOG_LEVEL, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

FRONTEND_ORIGINS = [os.getenv('FRONTEND_ORIGIN', "http://localhost:3000"), "http://localhost:5173"]

# Load catalogs once
DATA_DIR = os.getenv('DATA_DIR', str((os.path.dirname(__file__)) + '/data'))
catalogs = Catalogs.load(DATA_DIR)
logger.info("Catalogs loaded: traits=%d clinvar=%d protein=%d pgs=%d aa_windows=%d", len(catalogs.traits), len(catalogs.clinvar), len(catalogs.protein_map), len(catalogs.pgs), len(catalogs.aa_windows))

app = FastAPI(title="GreatJeans API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=FRONTEND_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"]) 

DISCLAIMER = "Educational use only; not medical or diagnostic."

class AnalyzeBody(AnalyzeRequest):
    pass

class SSPredictBody(BaseModel):
    wt_seq: str
    mut_seq: str
    center: int | None = None


@app.post('/upload', response_model=UploadResponse)
async def upload(file: UploadFile = File(...), request: Request = None):
    try:
        content = await file.read()
        uid = storage.save_upload(content, file.filename)
    except MemoryError:
        raise HTTPException(status_code=413, detail={'error': 'file_too_large', 'limit_mb': storage.MAX_UPLOAD_MB})
    except ValueError as e:
        raise HTTPException(status_code=400, detail={'error': str(e)})

    # detect format (best-effort)
    fmt = None
    head = content[:4000]
    try:
        if is_23andme_text(head.decode(errors='ignore')):
            fmt = '23andme'
        elif is_vcf(head):
            fmt = 'vcf'
    except Exception:
        fmt = None
    logger.info(f"event=upload_saved upload_id={uid} filename={file.filename} size={len(content)} format={fmt}")
    return UploadResponse(upload_id=uid, format=fmt)


def detect_and_parse(raw: bytes):
    head = raw[:4000]
    if is_23andme_text(head.decode(errors='ignore')):
        df = parse_23andme(raw)
        fmt = '23andme'
        return df, fmt
    if is_vcf(head):
        variants = parse_vcf(raw)
        # convert to DF to reuse downstream
        df = pd.DataFrame(variants)
        if df.empty:
            raise ValueError('no_variants_parsed')
        fmt = 'vcf'
        return df, fmt
    raise ValueError('unsupported_format')


def qc_metrics(df: pd.DataFrame, fmt: str):
    n = len(df)
    missing = df['genotype'].isna().sum()
    allele_ok = df['genotype'].fillna('').apply(lambda g: all(a in 'ACGT.' for a in g)).mean()
    return {
        'format': fmt,
        'n_snps': n,
        'missing_pct': round(missing / max(1,n), 4),
        'allele_sanity': round(float(allele_ok),4)
    }


def make_result_json(df: pd.DataFrame, fmt: str, run_traits: bool, run_protein: bool, run_pgs: bool, target_rsid: str = None):
    ann_vars = annotate_variants(df, catalogs)
    gw = genome_window(df)
    traits = build_traits_section(df, catalogs) if run_traits else []
    protein = build_protein_block(df, catalogs, target_rsid) if run_protein else None
    pgs = compute_bmi_pgs(df, catalogs) if run_pgs else None
    result = {
        'qc': qc_metrics(df, fmt),
        'genome_window': gw,
        'variants': ann_vars,
        'traits': traits,
        'protein': protein,
        'pgs': pgs,
        'ai_summary': {'paragraph': '<placeholder>', 'caveats': ['coverage','population limits','not medical advice']},
        'disclaimer': DISCLAIMER
    }
    # enforce contract keys order by constructing into ResultJSON
    return ResultJSON(**result)


FORCE_DEMO = os.getenv('FORCE_DEMO','0') == '1'

def ensure_contract(res: ResultJSON) -> ResultJSON:
    # Basic presence checks, mutate model_dump then rebuild
    d = res.model_dump()
    notes = []
    if 'qc' not in d:
        d['qc'] = {'format':'unknown','n_snps':0,'missing_pct':0.0}; notes.append('qc_injected')
    if 'genome_window' not in d:
        d['genome_window'] = {'chrom':'chr17','start':7676125,'end':7676175,'rsid':'rs1042522'}; notes.append('window_injected')
    if 'variants' not in d or not isinstance(d['variants'], list):
        d['variants'] = []; notes.append('variants_injected')
    if 'ai_summary' not in d:
        d['ai_summary'] = {'paragraph':'<placeholder>','caveats':['coverage','population limits','not medical advice']}; notes.append('ai_summary_injected')
    if notes:
        d.setdefault('notes', notes)
    return ResultJSON(**d)

@app.post('/analyze', response_model=ResultJSON)
async def analyze(body: AnalyzeBody, request: Request = None, demo: bool = False):
    t0 = time.time()
    if FORCE_DEMO or request.query_params.get('demo') == '1':
        return await demo_result()
    try:
        raw = storage.load_upload_bytes(body.upload_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail={'error':'upload_not_found'})
    try:
        df, fmt = detect_and_parse(raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={'error': str(e)})
    result = make_result_json(df, fmt, body.run_traits, body.run_protein, body.run_pgs, body.target_rsid)
    # mini_model injection
    try:
        if result.protein and result.protein.residues:
            rsid0 = result.protein.residues[0].rsid
            win = catalogs.aa_windows.get(rsid0)
            if win:
                ss = predict_secondary_structure(win['wt_seq'], win['mut_seq'])
                result.mini_model = {
                    'window': {'center': win.get('center',15), 'length': win.get('length', len(win['wt_seq']))},
                    **ss
                }
    except Exception as e:  # non-fatal
        logger.warning(f"mini_model_inject_failed err={e}")
    result = ensure_contract(result)
    logger.info(f"event=analyze_done upload_id={body.upload_id} fmt={result.qc['format']} n={result.qc['n_snps']} time_ms={(time.time()-t0)*1000:.1f}")
    return result


@app.get('/demo/na12878', response_model=ResultJSON)
async def demo_result():
    # If a precomputed JSON exists (results_demo.json), serve it for instant load.
    import json, os
    demo_json_path_candidates = [
        os.path.join(os.getcwd(), 'backend', 'data', 'results_demo.json'),
        os.path.join(os.getcwd(), 'results_demo.json')
    ]
    for p in demo_json_path_candidates:
        if os.path.exists(p):
            try:
                with open(p,'r') as f:
                    data = json.load(f)
                # Validate via model (will raise if shape off)
                return ResultJSON(**data)
            except Exception as e:
                logger.warning(f"failed to load canned demo result from {p}: {e}")
                break
    # Fallback dynamic build
    import pandas as pd
    df = pd.DataFrame([
        {'rsid':'rs1042522','chrom':'chr17','pos':7676150,'genotype':'GG'},
        {'rsid':'rs4988235','chrom':'chr2','pos':136608646,'genotype':'CT'}
    ])
    return make_result_json(df, '23andme', True, True, True, None)


@app.delete('/uploads/{upload_id}')
async def delete_upload(upload_id: str):
    storage.delete_upload(upload_id)
    logger.info(f"event=delete upload_id={upload_id}")
    return {'status':'deleted','upload_id': upload_id}


@app.get('/')
async def root():
    return {'service':'GreatJeans','endpoints':['/upload','/analyze','/demo/na12878'],'disclaimer': DISCLAIMER}


@app.get('/health')
async def health():
    return {"ok": True}

@app.get('/version')
async def version():
    return {
        'version': '0.1.0',
        'catalogs': {
            'traits': str(catalogs.traits_path.name),
            'clinvar': str(catalogs.clinvar_path.name),
            'protein_map': str(catalogs.protein_map_path.name),
            'pgs': str(catalogs.pgs_path.name),
            'aa_windows': str(catalogs.aa_windows_path.name)
        }
    }

# AI explain endpoints
class AIExplainBody(BaseModel):
    variants: list[dict] = []
    traits: list[dict] = []
    protein: dict | None = None

@app.get('/ai/example')
async def ai_example():
    return {
        "variants":[{"rsid":"rs1042522","gene":"TP53"}],
        "traits":[{"trait":"Lactose tolerance","rsid":"rs4988235","status":"covered"}],
        "protein":{"uniprot":"P04637","residues":[{"rsid":"rs1042522","index":72}]}
    }

@app.post('/ai/explain')
async def ai_explain(body: AIExplainBody):
    if os.getenv('LLM_API_KEY'):
        # Placeholder for real call; for now still deterministic.
        paragraph = "This summary is generated using the provided variants and traits (LLM stub)."
    else:
        paragraph = "Demo explanation: Provided variants include a common TP53 coding change. Traits list shows coverage; educational only."
    return {
        'paragraph': paragraph,
        'caveats': ['coverage limits','population limits','not medical advice']
    }

# Protein window endpoint
class ProteinWindowBody(BaseModel):
    rsid: str

@app.post('/protein/window')
async def protein_window(body: ProteinWindowBody):
    win = catalogs.aa_windows.get(body.rsid)
    if not win:
        raise HTTPException(status_code=404, detail={'error':'rsid_not_found','rsid': body.rsid})
    return {
        'wt_seq': win['wt_seq'],
        'mut_seq': win['mut_seq'],
        'center': win.get('center',15),
        'length': win.get('length', len(win['wt_seq']))
    }

@app.post('/model/ss_predict')
async def ss_predict(body: SSPredictBody):
    res = predict_secondary_structure(body.wt_seq, body.mut_seq)
    window = {"center": body.center if body.center is not None else len(body.wt_seq)//2, "length": len(body.wt_seq)}
    return {**res, 'window': window}

# Structured error handlers
@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {'message': str(exc.detail)}
    code_map = {400:'bad_request',404:'not_found',413:'too_large'}
    body = {"error": {"code": code_map.get(exc.status_code,'error'), "message": detail.get('error') or detail.get('message'), "detail": detail, 'request_id': getattr(request.state,'req_id',None)}}
    return JSONResponse(status_code=exc.status_code, content=body)

@app.middleware('http')
async def add_request_id_logging(request: Request, call_next):
    req_id = str(uuid.uuid4())
    start = time.time()
    request.state.req_id = req_id
    logger.info(f"event=request_start req_id={req_id} path={request.url.path}")
    try:
        response = await call_next(request)
        return response
    finally:
        dur = (time.time()-start)*1000
        logger.info(f"event=request_end req_id={req_id} path={request.url.path} ms={dur:.1f}")

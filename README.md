# GreatJeans

FastAPI demo genomics backend from MIT hackathon. Educational only – not medical or diagnostic.

## Features
- Upload consumer DNA raw data (.txt 23andMe style, .vcf, .vcf.gz)
- Lightweight parsing & QC
- Local trait & protein annotations (tiny CSV catalogs)
- Optional toy BMI polygenic score
- Single unified Result JSON contract for frontend
- Demo endpoint for instant UI work
- One-click delete of uploaded data

## Run (dev)
```
uvicorn backend.api:app --reload
```

## Tests
```
pytest -q
```

## Endpoints
- POST /upload -> { upload_id }
- POST /analyze -> Result JSON
- GET /demo/na12878 -> canned Result JSON
- DELETE /uploads/{upload_id} -> { status: "deleted" }

## Result JSON (example shape)
See tests and `backend/models.py` for schema. Includes keys: qc, genome_window, variants, traits, protein, pgs, ai_summary, disclaimer.

## Privacy & Storage
- Files stored under ./storage/tmp/<upload_id>/input
- Default max upload size 20 MB
- DELETE truly removes directory
- No database; all local ephemeral

## Disclaimer
Educational use only; not for clinical or diagnostic purposes. No medical advice.


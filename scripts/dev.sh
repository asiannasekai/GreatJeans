#!/usr/bin/env bash
set -euo pipefail
export FRONTEND_ORIGIN=${FRONTEND_ORIGIN:-http://localhost:3000}
export MAX_UPLOAD_MB=${MAX_UPLOAD_MB:-20}
export DATA_DIR=${DATA_DIR:-backend/data}
exec uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000

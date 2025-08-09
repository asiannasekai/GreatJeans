#!/usr/bin/env bash
set -euo pipefail
BASE=${BASE:-http://localhost:8000}
echo "[1] Health" && curl -s $BASE/health | jq .
UP_JSON=$(curl -s -F file=@backend/data/demo/sample_23andme.txt $BASE/upload)
UPLOAD_ID=$(echo "$UP_JSON" | jq -r .upload_id)
echo "[2] Upload ID: $UPLOAD_ID"
AN_JSON=$(curl -s -H 'Content-Type: application/json' -d '{"upload_id":"'$UPLOAD_ID'","run_traits":true,"run_protein":true,"run_pgs":false}' $BASE/analyze)
VAR_COUNT=$(echo "$AN_JSON" | jq '.variants | length')
HAS_PROT=$(echo "$AN_JSON" | jq 'has("protein")')
HAS_MINI=$(echo "$AN_JSON" | jq 'has("mini_model")')
echo "[3] Analyze variants=$VAR_COUNT protein=$HAS_PROT mini_model=$HAS_MINI"
DEL=$(curl -s -X DELETE $BASE/uploads/$UPLOAD_ID)
echo "[4] Delete: $DEL"
DEMO=$(curl -s $BASE/demo/na12878 | jq '.qc.format,.genome_window.rsid')
echo "[5] Demo: $DEMO"

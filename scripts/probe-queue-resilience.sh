#!/usr/bin/env bash
# Sondas de resiliencia de cola contra ATLX Media Engine v1.
#
#   1. IDEMPOTENCIA — tres altas con el MISMO clientReferenceId deben devolver
#      un solo mediaId y encolar un solo job. Es el mecanismo que evita que
#      cinco reintentos del usuario generen cinco transcodificaciones.
#   2. ERROR PERMANENTE — un archivo que ffmpeg no sabe decodificar debe cerrar
#      en `failed` con un solo intento, sin entrar en reintentos.
#
# Uso: bash scripts/probe-queue-resilience.sh [base_url] [archivo_corrupto]
set -u

BASE="${1:-http://127.0.0.1:4100}"
CORRUPTO="${2:-/tmp/basura.mp4}"
STAMP="$(date +%s)"
ACTOR="RESILIENCE-$STAMP"

api() { curl -s -m 30 "$@"; }

echo "=== 1. IDEMPOTENCIA ==="
REF="IDEM-$STAMP"
IDS=""
for i in 1 2 3; do
  R=$(api -X POST "$BASE/api/media/v1/requests" \
    -H 'Content-Type: application/json' \
    -d "{\"sourceApp\":\"antojados\",\"sourceActorType\":\"user\",\"sourceActorId\":\"$ACTOR\",
         \"targetContext\":\"post\",\"mediaType\":\"image\",
         \"clientReferenceId\":\"$REF\"}")
  ID=$(printf '%s' "$R" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("mediaId","?"))' 2>/dev/null)
  echo "  intento $i -> $ID"
  IDS="$IDS $ID"
done
UNICOS=$(printf '%s\n' $IDS | sort -u | wc -l | tr -d ' ')
echo "  mediaIds distintos: $UNICOS (esperado 1)"
echo "MEDIA_ID_IDEM=$(printf '%s\n' $IDS | head -1)"

echo
echo "=== 2. ERROR PERMANENTE ==="
[ -f "$CORRUPTO" ] || printf 'esto no es un video en absoluto\n%.0s' $(seq 1 200) > "$CORRUPTO"

CREATE=$(api -X POST "$BASE/api/media/v1/requests" \
  -H 'Content-Type: application/json' \
  -d "{\"sourceApp\":\"antojados\",\"sourceActorType\":\"user\",\"sourceActorId\":\"$ACTOR\",
       \"targetContext\":\"post\",\"mediaType\":\"video\",
       \"clientReferenceId\":\"CORRUPT-$STAMP\"}")
MID=$(printf '%s' "$CREATE" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("mediaId",""))' 2>/dev/null)
echo "CREATE: $MID"

if [ -n "$MID" ]; then
  UP=$(api -X POST "$BASE/api/media/v1/$MID/original" \
    -F "file=@$CORRUPTO" -F "mime_type=video/mp4" -F "extension=mp4")
  echo "UPLOAD: $(printf '%s' "$UP" | head -c 200)"

  for t in $(seq 1 24); do
    sleep 5
    S=$(api "$BASE/api/media/v1/$MID/ready-payload")
    ST=$(printf '%s' "$S" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status",""))' 2>/dev/null)
    if [ "$ST" = "ready" ] || [ "$ST" = "failed" ]; then
      echo "estado final en $((t*5))s: $ST"
      printf '%s\n' "$S" | head -c 400
      echo
      break
    fi
  done
fi
echo "MEDIA_ID_CORRUPTO=$MID"

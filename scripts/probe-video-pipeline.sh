#!/bin/bash
# Sonda de extremo a extremo del pipeline de video.
# Crea un media request, declara derechos, sube el original y mide el tiempo
# hasta `ready`. Uso: ./probe-video-pipeline.sh <archivo.mp4> [base_url]
set -u

FILE="${1:?uso: probe-video-pipeline.sh <archivo.mp4> [base_url]}"
BASE="${2:-http://127.0.0.1:4100}"
ACTOR="GUARDIAN-PROBE-$(date +%s)"

REQ=$(curl -s -X POST "$BASE/api/media/v1/requests" -H "Content-Type: application/json" \
  -d "{\"sourceApp\":\"antojados\",\"sourceActorType\":\"user\",\"sourceActorId\":\"$ACTOR\",\"targetContext\":\"post\",\"mediaType\":\"video\",\"clientReferenceId\":\"$ACTOR-1\"}")
MID=$(echo "$REQ" | sed -E 's/.*"mediaId":"([^"]+)".*/\1/')
echo "CREATE: $REQ"

if [ -z "$MID" ] || [ "$MID" = "$REQ" ]; then echo "SIN mediaId, abortando"; exit 1; fi

curl -s -X POST "$BASE/api/media/v1/$MID/rights-origin" -H "Content-Type: application/json" \
  -d '{"originType":"external_platform","originPlatform":"antojados","engineWatermarkPolicy":"skip","ownershipType":"third_party","licenseScope":"platform_public","rightsDeclaration":"i_have_permission","rightsStatus":"declared","licenseType":"external_unverified","allowPublicDisplay":true,"allowShare":true}' >/dev/null

T0=$(date +%s)
UP=$(curl -s -X POST "$BASE/api/media/v1/$MID/original" -F "file=@$FILE;type=video/mp4")
echo "UPLOAD: $(echo "$UP" | head -c 200)"

for i in $(seq 1 200); do
  R=$(curl -s "$BASE/api/media/v1/$MID/ready-payload")
  ST=$(echo "$R" | sed -E 's/.*"status":"([^"]*)".*/\1/')
  D=$(( $(date +%s) - T0 ))
  if echo "$R" | grep -q '"ready":true'; then
    echo "READY en ${D}s"
    echo "$R" | head -c 900
    break
  fi
  if [ "$ST" = "failed" ]; then
    echo "FAILED en ${D}s"
    echo "$R" | head -c 600
    break
  fi
  sleep 3
done

echo ""
echo "MID=$MID"

# Leonardo Recipes

Copy-paste recipes mapped from https://docs.leonardo.ai/llms.txt. Each recipe is a one-liner; pipe through `--json | jq` for agent mode.

## Image — Text to Image

```bash
# Lucid Origin photoreal
leo generate "<prompt>" -m 7b592283-e8a7-4c5a-9ba6-d18c31f258b9 \
  --alchemy --contrast 3.5 -o out.png

# Phoenix Ultra
leo generate "<prompt>" -m de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3 \
  --alchemy --ultra -w 1024 -h 1024

# Anime
leo generate "<prompt>" -m e71a1c2f-4f80-4800-934f-2c68979d8cc8

# Batch with seed
leo generate "<prompt>" -d ./outputs -n 4 --seed 42
```

## Image — Upscale

```bash
# Universal upscale
leo upscale <imageId>
leo variation <variationId> -o upscaled.png
```

## Video — Motion 2.0

```bash
# Text → 720p
leo video "<prompt>" -m MOTION2 --resolution RESOLUTION_720 --enhance

# Text → 480p (cheapest)
leo video "<prompt>" -m MOTION2FAST --resolution RESOLUTION_480
```

## Video — Veo 3 / 3.1

```bash
# Veo3 720p 8s
leo video "<prompt>" -m VEO3 --resolution RESOLUTION_720

# Veo3.1 (latest)
leo video "<prompt>" -m VEO3_1 --resolution RESOLUTION_720 --enhance

# Veo3 Fast (cheaper)
leo video "<prompt>" -m VEO3FAST --resolution RESOLUTION_720
```

## Video — Kling

```bash
# Kling 2.5 Turbo
leo video "<prompt>" -m Kling2_5 --resolution RESOLUTION_720

# Kling 3.0 (newest)
leo video "<prompt>" -m kling-3.0 --resolution RESOLUTION_720

# Kling O3 (with editing capability)
leo video "<prompt>" -m kling-video-o-3 --resolution RESOLUTION_720
```

## Video — Hailuo / LTX / Seedance

```bash
leo video "<prompt>" -m hailuo-2_3 --resolution RESOLUTION_720
leo video "<prompt>" -m ltxv-2.3-pro --resolution RESOLUTION_720
leo video "<prompt>" -m seedance-2.0 --resolution RESOLUTION_720
leo video "<prompt>" -m seedance-2.0-fast --resolution RESOLUTION_480
```

## Polling pipeline (video)

```bash
# Submit + poll + download in one shell flow
JOB=$(leo video "<prompt>" -m VEO3_1 --json | jq -r .generationId)
echo "Polling $JOB..."
while :; do
  STATUS=$(leo status "$JOB" --json | jq -r .status)
  [ "$STATUS" = "COMPLETE" ] && break
  [ "$STATUS" = "FAILED" ] && { echo "failed"; exit 1; }
  sleep 10
done
URL=$(leo status "$JOB" --json | jq -r '.url // .videoUrl // .images[0].url')
curl -L -o out.mp4 "$URL"
```

## Account / models

```bash
leo me                    # credits + tier
leo models                # list image models
leo models --limit 10
leo video-models          # list video model enum
leo config path           # debug key resolution
```

## Notes

- For full per-recipe docs: https://docs.leonardo.ai/recipes/
- For platform model UUIDs: always cross-check with `leo models` (Leonardo updates frequently).
- Video URLs in `leo status` response field name varies by model — fall back to `.images[0].url` or inspect `--json` output.

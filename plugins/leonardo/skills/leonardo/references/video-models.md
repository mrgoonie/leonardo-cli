# Video Models — Full Enum

Video models are **hardcoded enum values** (case-sensitive), unlike image models. Source: https://docs.leonardo.ai/llms.txt. Verify with `leo video-models`.

## Models

| ID (case-sensitive) | Name | t2v | i2v | Notes |
|---|---|:---:|:---:|---|
| `MOTION2` | Motion 2.0 | ✓ | ✓ | Default, balanced |
| `MOTION2FAST` | Motion 2.0 Fast | ✓ | ✓ | Cheaper, faster |
| `VEO3` | Veo 3.0 | ✓ | ✓ | High quality, expensive |
| `VEO3FAST` | Veo 3.0 Fast | ✓ |  | Cheaper Veo |
| `VEO3_1` | Veo 3.1 | ✓ | ✓ | Latest Veo |
| `KLING2_1` | Kling 2.1 Pro | ✓ | ✓ | |
| `Kling2_5` | Kling 2.5 Turbo | ✓ | ✓ | Note PascalCase |
| `kling-2.6` | Kling 2.6 | ✓ | ✓ | Note kebab-case |
| `kling-3.0` | Kling 3.0 | ✓ |  | Latest Kling |
| `kling-video-o-1` | Kling O1 | ✓ | ✓ | |
| `kling-video-o-3` | Kling O3 | ✓ | ✓ | Edit support |
| `hailuo-2_3` | Hailuo 2.3 | ✓ | ✓ | |
| `ltxv-2.0-pro` | LTX 2.0 Pro | ✓ | ✓ | |
| `ltxv-2.3-pro` | LTX 2.3 Pro | ✓ | ✓ | Latest LTX |
| `seedance-2.0` | Seedance 2.0 | ✓ | ✓ | |
| `seedance-2.0-fast` | Seedance 2.0 Fast | ✓ | ✓ | |

## Resolutions

`RESOLUTION_480`, `RESOLUTION_720`, `RESOLUTION_1080` (per-model support varies — Veo3 supports 1080p, Motion2 maxes at 720p).

## CLI flags

```
-m, --model <id>        Video model id (default MOTION2)
--resolution <r>        e.g. RESOLUTION_720
--enhance               Auto-enhance prompt
--frame-interpolation   Smoother motion
```

## Recommendations

- **Quick draft**: `MOTION2FAST` @ 480p
- **Cinematic premium**: `VEO3_1` @ 720p with `--enhance`
- **Image-to-video**: most models support i2v; check table above
- **Lowest cost**: `seedance-2.0-fast` or `MOTION2FAST`

## Caveats

- `MOTION2FAST` and newer Kling/Hailuo/LTX/Seedance models may be gated by Leonardo plan tier — expect 4xx if account lacks access.
- IDs are inconsistent across families (UPPERCASE vs PascalCase vs kebab-case). Copy-paste verbatim.
- Video gen does NOT auto-poll/download — `leo video` returns `generationId` only. Pipeline:
  ```bash
  JOB=$(leo video "<prompt>" -m VEO3_1 --json | jq -r .generationId)
  leo status $JOB --json | jq -r '.url' | xargs curl -O
  ```

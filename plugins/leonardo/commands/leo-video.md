---
description: Generate a video with Leonardo.Ai (text-to-video, returns jobId; offers to poll + download). Use the `leonardo` skill for context.
argument-hint: <prompt> [-m <model>] [--resolution RESOLUTION_720] [--enhance] [--frame-interpolation]
---

Activate the `leonardo` skill, then drive `leo video` with the user-provided arguments.

**Arguments:** $ARGUMENTS

Steps:
1. Verify install + auth (`leo --version`, `leo me`). Bail with troubleshooting tip on failure.
2. Pick a model:
   - If `-m/--model` not supplied, default to `MOTION2` (cheapest balanced).
   - If user mentions "cinematic", "movie", "high quality" → suggest `VEO3_1`.
   - If user mentions "fast", "quick", "draft" → suggest `MOTION2FAST` or `seedance-2.0-fast`.
   - Cross-check the chosen ID against `references/video-models.md` (case-sensitive!).
3. Submit: `leo video "<prompt>" -m <model> --resolution <r> --json` → capture `generationId`.
4. Ask the user (unless --json/auto): "Poll until done and download mp4? (y/n)". If yes:
   ```bash
   while STATUS=$(leo status $JOB --json | jq -r .status); [ "$STATUS" != "COMPLETE" ] && [ "$STATUS" != "FAILED" ]; do
     sleep 10
   done
   ```
   Then `curl -L -o video.mp4 "$URL"` from the response.
5. Report the saved mp4 path or, on FAILED status, surface the error and check credits via `leo me`.

Reminder: video gen costs more than images. Confirm with `leo me` before large/Veo runs.

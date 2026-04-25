---
description: Generate an image with Leonardo.Ai (text-to-image, polled, downloaded). Use the `leonardo` skill for context.
argument-hint: <prompt> [--model <uuid>] [--alchemy] [--ultra] [-w 1024] [-h 1024] [-n 1] [-o file | -d dir]
---

Activate the `leonardo` skill, then run the `leo generate` command with the user-provided arguments below.

**Arguments:** $ARGUMENTS

Steps:
1. Verify CLI is installed: run `leo --version`. If missing, instruct user `npm i -g leonardo-cli`.
2. Verify auth: run `leo me` (in `--json` mode if non-interactive). If exit 3, surface `references/troubleshooting.md` auth section.
3. Construct the generate command:
   - If user passed only a prompt and no output flag, default to `-d ./outputs` (creates dir if missing).
   - If running inside an automated/agent flow, append `--json` so output is machine-readable.
   - Pick a sensible default model from `references/image-models.md` if `-m/--model` not supplied (Lucid Origin for general; Anime XL for anime; Phoenix Ultra for premium).
4. Execute via Bash and stream progress.
5. On exit code != 0, consult `references/troubleshooting.md` and report the fix.
6. Report saved file paths (or URLs if `--no-download`).

If the user asks for "the same image again", reuse the previous `--seed` value.

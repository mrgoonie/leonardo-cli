# Troubleshooting

Quick fixes for common issues with the `leonardo` CLI.

## Auth errors (exit 3)

```
Error: missing API key
```

Resolution order:
1. `leo config path` — shows where the key is being loaded from (or "not found").
2. `leo config show` — shows the redacted effective config.
3. Set explicitly: `leo config set apiKey lk_xxxxx` (writes `~/.config/leonardo-cli/config.json`).
4. Or export env: `export LEONARDO_API_KEY=lk_xxxxx`.

If a `.env` is present in cwd but not picked up, ensure file is named `.env`, `.env.local`, or `.env.<NODE_ENV>` and contains `LEONARDO_API_KEY=lk_...`.

## Polling timeout (exit 5)

```
Polling timeout after 480000ms
```

- Re-poll: `leo status <generationId>` — generation may still complete server-side.
- Increase: `--wait-timeout 900000` (15 min) for Veo/large batches.
- Check status manually before retrying full generation (don't waste credits).

## API errors (exit 4)

| HTTP | Likely cause | Fix |
|---|---|---|
| 400 | Bad model id / param | Check `leo models` or `leo video-models`; verify case |
| 401 | Invalid key | Rotate at https://app.leonardo.ai/api-access |
| 402 | Out of credits | `leo me` — top up or wait for refresh |
| 403 | Plan tier blocks model | Upgrade plan or pick another model |
| 429 | Rate limited | Back off + retry |
| 5xx | Leonardo upstream | Check status page; retry with backoff |

## Empty `images[]` despite COMPLETE status

Content-policy filter triggered server-side. Revise prompt — remove flagged terms, real-person names, NSFW phrasing.

## Video model rejected

Enum is case-sensitive and inconsistent across families:
- ✅ `Kling2_5` (PascalCase)
- ❌ `kling2_5` / `KLING2_5`
- ✅ `kling-3.0` (kebab + dot)
- ✅ `MOTION2FAST` (UPPERCASE)
- ✅ `hailuo-2_3` (kebab + underscore)

Always copy verbatim from `leo video-models` output.

## File not downloading

- Check `-o` vs `-d`: `-o` for single file, `-d` for directory (auto-named).
- `-n > 1` forces directory mode (single file path becomes ambiguous).
- `--no-download` skips files entirely; remove if you want assets on disk.

## Debugging tips

```bash
leo --version                   # confirm install
leo config path                 # key resolution debug
leo me --json | jq              # account state
leo generate "test" --json      # full payload to inspect
LEONARDO_BASE_URL=... leo me    # override API base for staging
```

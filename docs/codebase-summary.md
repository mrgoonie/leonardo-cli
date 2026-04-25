# Codebase Summary

## Layout

```
src/
├── cli.ts                  # commander entry, top-level options, error handler
├── api/
│   ├── client.ts           # fetch wrapper w/ Bearer auth + LeonardoApiError
│   └── types.ts            # request/response types (subset of Leonardo API)
├── commands/
│   ├── generate.ts         # text-to-image: submit, poll, download
│   ├── video.ts            # text-to-video job submit
│   ├── upscale.ts          # universal upscaler + variation fetch
│   ├── status.ts           # generation lookup
│   ├── models.ts           # /platformModels listing
│   ├── video-models.ts     # static enum list of video models
│   ├── me.ts               # account info
│   └── config.ts           # config get/set/path/show
├── config/
│   ├── paths.ts            # XDG + walk-up file discovery
│   ├── schema.ts           # LeonardoConfig + ResolvedConfig + defaults
│   ├── load-dotenv.ts      # dependency-free .env parser + walk-up loader
│   └── resolve.ts          # 5-tier key resolution + redaction
└── utils/
    ├── log.ts              # JSON-aware logger (stderr) + emit() for stdout
    ├── poll.ts             # generic poll-with-backoff
    └── output.ts           # download, filename auto-gen, output target resolution
```

## Key Modules

### `config/resolve.ts`
Single source of truth for credentials and effective settings. Returns `ResolvedConfig` with both values *and* their source path — used by `config path` to debug resolution.

### `api/client.ts`
Thin `fetch` wrapper. Throws `LeonardoApiError` with status + body on non-2xx. No retry (fail-fast).

### `commands/generate.ts`
Most complex command. Flow:
1. `resolveConfig()` + `requireApiKey()`
2. POST `/generations`
3. Poll `/generations/{id}` until `COMPLETE` or `FAILED`
4. For each image: download or emit URL
5. `emit()` final JSON or human summary

### `utils/log.ts`
`log.info/step/success/warn/error` → stderr. `emit(payload, humanRender)` → stdout in JSON mode, calls `humanRender` otherwise. Single switch toggles colors and JSON vs. human shape.

## Entry Points

- Source: `bun src/cli.ts ...` (dev)
- Bundled: `dist/cli.js` (single-file, Node 20+ compatible)
- Bin field: `leonardo` after `npm i -g leonardo-cli`

## External Deps

| Package | Purpose | Why this one |
|---|---|---|
| `commander` | CLI parsing | Stable, mature, small |
| `picocolors` | Terminal colors | Zero-dep, fast, ~1KB |

Dev only: `typescript`, `@types/bun`, `@types/node`.

## Test Status

No unit tests yet. E2E verified manually against live API:
- `me`, `models --limit N`
- `generate` with 5 different models (Lucid Origin, Phoenix 1.0, Anime XL, Kino XL, 3D Animation)
- `--json` output piped through `jq`
- `.env` resolution

## Claude Code Plugin

Repo doubles as a Claude Code plugin marketplace:
- `.claude-plugin/marketplace.json` — marketplace catalog
- `plugins/leonardo/` — plugin with skill (SKILL.md + 4 references) and slash commands (`/leo-gen`, `/leo-video`)

Install: `/plugin marketplace add mrgoonie/leonardo-cli` then `/plugin install leonardo@leonardo-marketplace`.

## Known Gaps

- `video` and `upscale` schemas follow docs but not e2e verified.
- No retry/backoff on transient 5xx.
- `extFromUrl` always uses URL extension; user-supplied `-o foo.png` for a JPEG-serving CDN keeps the user's filename.

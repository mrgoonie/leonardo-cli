# System Architecture

## High-Level Flow

```
                ┌───────────────────────────────────┐
                │            CLI Entry              │
                │  src/cli.ts (commander)           │
                └────────────────┬──────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
     │ Config Resolve │  │ Logger       │  │ Command Reg. │
     │ src/config/    │  │ src/utils/   │  │ src/commands │
     └────────┬───────┘  │   log.ts     │  └──────┬───────┘
              │          └──────────────┘         │
              ▼                                   ▼
     ┌────────────────┐                   ┌──────────────┐
     │  Resolved      │  ───────────────► │ Leonardo     │
     │  Config        │                   │ Client       │
     │  (apiKey, …)   │                   │ src/api/     │
     └────────────────┘                   │   client.ts  │
                                          └──────┬───────┘
                                                 ▼
                                          ┌──────────────┐
                                          │ Leonardo.Ai  │
                                          │ REST API     │
                                          └──────────────┘
```

## Config Resolution (5-tier)

```
--api-key flag
      │ no
      ▼
process.env.LEONARDO_API_KEY        ← OS shell, exports, CI secrets
      │ no
      ▼
.env.local / .env (walk up)         ← project-local
      │ no
      ▼
./leonardo.config.json (walk up)    ← project, committable (without key)
      │ no
      ▼
$XDG_CONFIG_HOME/leonardo-cli/      ← user-level, persistent
   config.json
      │ no
      ▼
MissingApiKeyError → exit 3
```

`baseUrl` and `outputDir` follow the same chain (with their own env names).

## Generate Command Flow

```
generate <prompt>
      │
      ▼
resolveConfig + requireApiKey
      │
      ▼
POST /generations  ────────────► generationId
      │
      ▼
poll(GET /generations/:id)
      │  every 4s, max 120 attempts (~8 min)
      │
      ├── status=COMPLETE ──► download images ──► emit JSON / human
      ├── status=FAILED   ──► PollFailedError  ──► exit 4
      └── max attempts    ──► PollTimeoutError ──► exit 5
```

## Output Modes

```
                  ┌─── --json ──► stdout: { ok, generationId, images: [...] }
                  │              stderr: (silent or quiet)
emit(payload, fn) ┤
                  └─── human ──► stdout: nothing or primary data (URLs)
                                 stderr: ✓ Saved foo.png (812345 bytes)
```

Streams are always strictly separated so `--json | jq` never breaks.

## Module Dependency Graph

```
cli.ts
  └──► commands/*  ──► config/resolve  ──► config/paths
                                      ──► config/load-dotenv
                                      ──► config/schema
                  ──► api/client       ──► config/schema
                  ──► utils/log
                  ──► utils/poll
                  ──► utils/output
```

No cycles. `commands/*` is the top of the tree besides `cli.ts`.

## Build Pipeline

```
bun build src/cli.ts --target=node --outfile=dist/cli.js --minify
                │
                ▼
        single file ~54KB
        shebang preserved
        node 20+ compatible
```

NPM install path: bin field exposes `leonardo` → `dist/cli.js`.

## Release Flow (CI)

```
git tag v0.x.y
git push origin v0.x.y
      │
      ▼
GitHub Actions: .github/workflows/release.yml
      ├─ install + build
      ├─ npm publish (uses NPM_TOKEN secret)
      └─ gh release create (uses GITHUB_TOKEN auto-provided)
```

See `deployment-guide.md` for the full release procedure.

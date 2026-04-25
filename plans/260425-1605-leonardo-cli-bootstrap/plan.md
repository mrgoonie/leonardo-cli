# Leonardo CLI — Bootstrap Plan

**Stack:** Bun + TypeScript
**Repo:** mrgoonie/leonardo-cli
**API:** https://cloud.leonardo.ai/api/rest/v1

## Goals

- AI-agent friendly (`--json`, quiet, deterministic exit codes, stderr logs)
- Human friendly (colors, spinners, progress, helpful errors)
- Flexible API key resolution: OS env → process.env → `.env*` files → JSON config (XDG + project)
- Output controls: `-o <file>` or `-d <dir>` (auto-name fallback)

## Commands (v1)

| Command | Purpose |
|---|---|
| `leonardo generate <prompt>` | text-to-image, poll, download |
| `leonardo video <prompt>` | text-to-video |
| `leonardo upscale <imageId>` | universal upscaler |
| `leonardo status <generationId>` | poll/fetch a generation |
| `leonardo models` | list platform models |
| `leonardo me` | user info / credits |
| `leonardo config get/set/path` | manage JSON config |

## Architecture

```
src/
  cli.ts                 # entry, commander setup
  config/
    resolve.ts           # api-key + base-url resolution chain
    paths.ts             # XDG + project paths
    schema.ts            # config types
  api/
    client.ts            # fetch client w/ retry + auth
    types.ts             # request/response types
  commands/
    generate.ts
    video.ts
    upscale.ts
    status.ts
    models.ts
    me.ts
    config.ts
  utils/
    output.ts            # download, filename gen, dir resolve
    log.ts               # stderr logger + json mode
    poll.ts              # poll with backoff
```

## Key Resolution Order

1. `--api-key` CLI flag
2. `LEONARDO_API_KEY` in `process.env` (covers OS-level env)
3. `.env.local` → `.env.{NODE_ENV}` → `.env` (project dir, walk up)
4. Project config: `./leonardo.config.json` (walk up)
5. User config: `$XDG_CONFIG_HOME/leonardo-cli/config.json` (default `~/.config/...`)

First match wins. Same chain for `baseUrl`, `outputDir`, etc.

## AI/Human Output Modes

- Default: human (colors, spinner, progress, summary)
- `--json` (or `LEONARDO_JSON=1`): single JSON object on stdout, no spinner, no colors
- `--quiet`: suppress non-essential stderr
- Exit codes: 0 ok, 1 generic, 2 usage, 3 auth, 4 api, 5 timeout

## Phases

- [x] **P1** Scaffolding: package.json, tsconfig, README skeleton
- [ ] **P2** Config resolution + logger
- [ ] **P3** API client + types
- [ ] **P4** `generate` command (core path)
- [ ] **P5** Output utils (download, filenames)
- [ ] **P6** Remaining commands: video, upscale, status, models, me, config
- [ ] **P7** README, examples, agent-mode docs
- [ ] **P8** Verify build runs (`bun run leonardo --help`)

## Success Criteria

- `bun run leonardo generate "a cat" -o cat.png` produces image
- `bun run leonardo generate "a cat" --json` emits parseable JSON
- API key picked up from `.env.local`, `~/.config/leonardo-cli/config.json`, or env var
- README documents both human and agent usage

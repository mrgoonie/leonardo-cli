# Project Overview — PDR

## Product

**leonardo-cli** — A command-line interface for the Leonardo.Ai REST API.

Wraps image generation, video generation, upscaling, and account inspection in a single binary. Designed to serve two audiences from one tool:

- **Humans** — readable progress on stderr, colors, helpful errors.
- **AI agents / scripts** — `--json` output to stdout, deterministic exit codes, stable streams.

## Why

Leonardo's web UI and direct REST calls work, but for batch generation, agent integrations, and automation, a thin CLI removes boilerplate (auth, polling, file IO) without locking the user into an SDK.

## Goals (v1)

| Goal | Status |
|---|---|
| Cover image generation end-to-end (submit → poll → download) | ✅ |
| Cover video, upscale, status, models, account info | ✅ |
| Flexible API key resolution (flag → env → dotenv → project json → user json) | ✅ |
| Output controls (`-o file`, `-d dir`, auto-naming) | ✅ |
| Dual UX: human + JSON agent mode | ✅ |
| Single executable build | ✅ |
| GitHub Releases + NPM publish on tag | ⏳ |

## Non-Goals (v1)

- No interactive TUI / wizard flows
- No batch DSL or YAML pipelines (use shell + `--json`)
- No multi-account / profile system (one key per session)
- No image manipulation beyond what Leonardo's API exposes
- No SDK/library distribution — CLI-first

## Target Users

1. **Developers** scripting Leonardo into other tools (CI, content pipelines).
2. **AI agents** (Claude Code, etc.) given access to a shell.
3. **Power users** generating in bulk from terminal.

## Constraints

- Bun runtime ≥ 1.1 (build also targets Node ≥ 20 via bundle)
- Minimal deps: `commander`, `picocolors` (no SDK pinning, no axios)
- License: MIT
- Public repo: `mrgoonie/leonardo-cli`

## Success Metrics

- Single `bun src/cli.ts generate "<prompt>"` produces a valid image with API key from any of the 5 resolution sources.
- `--json` output round-trips through `jq` cleanly.
- Build artifact (`dist/cli.js`) ≤ 100KB after minification.
- Zero runtime deps once bundled.

## Open Questions

- Webhook callback support — defer until users ask (most poll fine).
- Profile/multi-account config — defer to v2.
- Auto-retry on transient 5xx — currently fail-fast; revisit if observed in practice.

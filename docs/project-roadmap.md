# Project Roadmap

## Phase 1 — MVP (current, v0.1)

Status: **complete**, awaiting first publish.

- [x] Bun + TS scaffold, single-file build
- [x] 5-tier API key resolution
- [x] Commands: generate, video, upscale, variation, status, models, me, config
- [x] Dual-mode output (human + `--json`)
- [x] Output controls (`-o`, `-d`, auto-naming)
- [x] Initial docs (`docs/`)
- [x] E2E smoke test (real API, 5 models)
- [ ] **GitHub Actions: CI (typecheck + build) + Release (NPM + Releases on tag)**
- [ ] First public release `v0.1.0`

## Phase 2 — Hardening (v0.2)

Status: planned.

- [ ] Retry with exponential backoff on transient 5xx
- [ ] `--watch` for `status` (poll until done)
- [ ] Image-to-image (`generate --init-image <path>`) with init image upload
- [ ] Webhook URL passthrough (`--callback-url`)
- [ ] First unit tests (config resolution, dotenv parser, polling)
- [ ] CI matrix: macOS + Linux + Windows

## Phase 3 — Power features (v0.3)

Status: speculative.

- [ ] ControlNet flag passthrough
- [ ] Dataset commands (create, upload, list, delete)
- [ ] Custom Element / Model training commands
- [ ] Profile/multi-account support (`--profile work`)
- [ ] Cost estimator (`--dry-run` shows credit cost before submit)

## Phase 4 — Ecosystem (v1.0)

Status: aspirational.

- [ ] Stable API surface; lock SemVer
- [ ] Homebrew tap
- [ ] Pre-built binaries via `bun build --compile` per OS/arch
- [ ] MCP server bundled (or sibling repo)
- [ ] Docs site (Mintlify or static)

## Cut from Scope

- Interactive TUI — out of scope; agents and humans both prefer flags.
- Image editing (crop/resize/format) — use ImageMagick/ffmpeg downstream.
- SDK/library export — focus is the CLI binary.

## Tracking

Issues live at https://github.com/mrgoonie/leonardo-cli/issues. Roadmap is updated when phases close.

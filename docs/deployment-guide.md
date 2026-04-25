# Deployment & Release Guide

## Distribution Channels

1. **NPM**: `npm i -g leonardo-cli` → exposes `leonardo` binary.
2. **GitHub Releases**: tagged source archive + (later) pre-built binaries.
3. **From source**: `bun install && bun run build`.

## One-Time Setup (Maintainer)

### 1. NPM publish access

- Create an automation token at https://www.npmjs.com/settings/<user>/tokens (Publish scope).
- The token is currently stored in the repo's local `.env` as `NPM_TOKEN` for reference only — **it must never be committed**.

### 2. GitHub repo secrets

Add to https://github.com/mrgoonie/leonardo-cli/settings/secrets/actions:

| Secret | Value | Used by |
|---|---|---|
| `NPM_TOKEN` | NPM automation token | `release.yml` → `npm publish` |
| `GITHUB_TOKEN` | (auto-provided by Actions) | `release.yml` → `gh release create` |

```bash
# convenience: set NPM_TOKEN from local .env via gh CLI
gh secret set NPM_TOKEN --body "$(grep '^NPM_TOKEN=' .env | cut -d= -f2-)"
```

### 3. Verify package metadata

In `package.json`:
- `name`, `version`, `bin`, `files` are correct.
- `repository.url` points to the public repo.
- `prepublishOnly` runs the build so published artifact is fresh.

## Release Procedure (Automated — release-please)

We use [release-please](https://github.com/googleapis/release-please) for fully automated, conventional-commit-driven releases. **No manual version bumping.**

### Day-to-day

Just commit with [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add image-to-image support      → minor bump
fix: handle empty prompt edge case    → patch bump
feat!: drop Node 18 support           → major bump (or "BREAKING CHANGE:" footer)
docs: improve README                  → patch bump (visible in changelog)
chore: bump deps                      → no bump (hidden)
```

### Release flow

```
push to main with conventional commits
        │
        ▼
release-please opens/updates a "Release PR"
  – bumps package.json + manifest
  – regenerates CHANGELOG.md
        │
   merge that PR
        │
        ▼
release-please tags v<x.y.z> + creates GitHub Release
        │
        ▼
publish job runs:
  – build dist/cli.js
  – npm publish --provenance (NPM_TOKEN)
  – upload dist/cli.js to the release
```

### Workflows

- `.github/workflows/release-please.yml` — release-please action + npm publish job
- `.github/workflows/ci.yml` — typecheck + build on every push/PR

### Config

- `release-please-config.json` — sections, tag format (`v${version}`)
- `.release-please-manifest.json` — current version, updated by the action

### Manual fallback

If release-please breaks, you can still cut a release by hand:

```bash
npm version patch
git push origin main --follow-tags
gh release create v$(node -p "require('./package.json').version") --generate-notes
# then manually trigger npm publish from your machine if needed
```

### Continuous Integration (`.github/workflows/ci.yml`)

On every push to `main` and every PR:

1. Bun setup
2. `bun install --frozen-lockfile`
3. `bun run typecheck`
4. `bun run build` (sanity check the bundle)

## Local Verification Before Tagging

```bash
bun run typecheck
bun run build
./dist/cli.js --version
./dist/cli.js me                 # smoke against your account
npm pack --dry-run               # confirm files included
```

## Rollback

Yanked-but-not-deleted: `npm deprecate leonardo-cli@<bad> "use <good> instead"`.

Hard pull (within 72h, last resort): `npm unpublish leonardo-cli@<bad>`.

For GitHub Release: `gh release delete v<bad> --yes`.

## Operational Notes

- The published artifact (`dist/cli.js`) is the bundled, minified JS. Source under `src/` is **not** published (controlled by `files` in `package.json`).
- Source shebang is `#!/usr/bin/env node` so end-users without Bun can `npm i -g leonardo-cli` and run `leonardo` directly. Bun build emits Node-compatible JS (no Bun-only APIs used).
- Maintainers running from source still use `bun src/cli.ts ...` regardless of the shebang.

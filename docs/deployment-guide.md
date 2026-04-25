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

## Release Procedure

### Cutting a release

```bash
# 1. Bump version (patches semver and creates a v<x.y.z> commit + tag)
npm version patch     # or `minor`, `major`

# 2. Push the tag (triggers CI release workflow)
git push origin main --follow-tags
```

That's it. CI takes over from here.

### What CI does (`.github/workflows/release.yml`)

On any tag matching `v*.*.*`:

1. `bun install --frozen-lockfile`
2. `bun run typecheck`
3. `bun run build` → produces `dist/cli.js`
4. `npm publish --access public` (uses `NPM_TOKEN`)
5. `gh release create $TAG --generate-notes` with `dist/cli.js` attached

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
- The shebang `#!/usr/bin/env bun` in `cli.ts` is fine — Bun build keeps it. End-users run via Node, but Bun's bundler outputs Node-compatible JS, so the shebang resolves to whichever runtime is on `PATH`. If users hit "bun not found", switch the shebang in the bundled output to `#!/usr/bin/env node`. (Add a small post-build sed if it becomes a real issue.)

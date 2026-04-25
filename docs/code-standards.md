# Code Standards

## Language & Toolchain

- **TypeScript strict mode** with `noUncheckedIndexedAccess` + `noImplicitOverride`
- **Bun** for dev/build; bundle targets Node 20+
- ESM only (`"type": "module"`)
- TS extension imports (`./foo.ts`) — `allowImportingTsExtensions: true`

## Naming

- Files: **kebab-case** (`load-dotenv.ts`, `resolve.ts`)
- Variables / functions: `camelCase`
- Types / interfaces / classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` (only for module-level immutable values)

## Module Organization

- Each file ≤ 200 LOC where reasonable. Split by concern (logger ≠ config ≠ api ≠ commands).
- Commands are register-functions (`registerGenerate(program)`) — never module-side-effect.
- `commands/*` may import from `api/`, `config/`, `utils/`. Reverse direction is forbidden.
- `config/`, `api/`, `utils/` may import sibling files inside their own folder. No cross-folder cycles.

## Error Handling

- Throw typed errors (`LeonardoApiError`, `MissingApiKeyError`, `PollTimeoutError`).
- Top-level `cli.ts` catches and maps to exit codes:
  - 0 ok · 1 generic · 2 usage · 3 auth · 4 API · 5 timeout
- Inside commands: try/catch only around the **single side-effecting call** that needs a specific exit code, not whole bodies.
- Never `console.log` for progress — use `log.*` (stderr) or `emit()` (stdout).

## Output Discipline

| Stream | Content |
|---|---|
| `stdout` | JSON object (in `--json` mode) **or** primary data (URLs, IDs) |
| `stderr` | Human progress, warnings, errors |

Rule: piping `stdout` to `jq` must always succeed in `--json` mode. Anything that breaks that is a bug.

## API Boundaries

- `LeonardoClient` is the only thing that calls `fetch()` to Leonardo. Commands don't.
- All HTTP returns parsed JSON or throws — no raw `Response` leaks out.

## Commenting

- Default: no comments. Names should carry meaning.
- Add a short comment **only** for: hidden constraints, non-obvious workarounds, security-relevant decisions, intentional limitations.
- Never describe "what" — code shows that. Describe "why" if surprising.

## Dependencies

- Avoid runtime deps unless they save real complexity.
- No `axios`/`got` — `fetch` is built in.
- No `dotenv` — we ship a 30-line parser (`load-dotenv.ts`).
- No `chalk` — `picocolors` is smaller and zero-dep.

## Adding a Command

1. Create `src/commands/<name>.ts` exporting `register<Name>(program: Command)`.
2. Inside, build a `Command`, configure logger, resolve config, call client, `emit()`.
3. Register in `cli.ts` after the existing ones.
4. Document it in `README.md` Commands table + (if user-facing flags) the relevant section.

## Versioning

- SemVer. Pre-1.0: minor = breaking, patch = feature/fix.
- Tag releases as `v0.X.Y`. CI publishes on tag push (see `deployment-guide.md`).

## Linting / Formatting

No formal linter yet (`tsc` + Bun's built-in checks). Add `biome` if it earns its keep. Default to:
- 2-space indent
- Single quotes only when escaping is shorter (otherwise double)
- Trailing commas in multi-line literals

# leonardo-cli

![leonardo-cli banner](./assets/banner.jpg)

A Leonardo.Ai command-line interface for generating images, videos, upscales, and more.

Designed to be both **AI-agent friendly** (`--json`, deterministic exit codes, stderr logs) and **human friendly** (colors, progress, helpful errors).

```
$ leonardo generate "a cyberpunk cat" -o cat.png
→ Submitting generation (1024x1024, n=1)
  generationId: 4f8e...
→ Polling for completion...
  attempt 1 — status: PENDING
  attempt 2 — status: COMPLETE
✓ Saved cat.png (812345 bytes)
done 1 image(s)
```

## Install

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
git clone https://github.com/mrgoonie/leonardo-cli.git
cd leonardo-cli
bun install

# run from source
bun run leonardo --help

# or build a single executable
bun run build && ./dist/cli.js --help
```

After `npm i -g leonardo-cli` you get two binaries pointing to the same CLI:

- `leonardo` — full name
- `leo` — short alias

## API Key

Get a key at <https://app.leonardo.ai/api-access>.

The CLI resolves your API key in this order — **first match wins**:

| Priority | Source | Example |
|---|---|---|
| 1 | `--api-key` flag | `leonardo --api-key lk_… me` |
| 2 | `LEONARDO_API_KEY` env var (incl. OS-level shell) | `export LEONARDO_API_KEY=lk_…` |
| 3 | `.env.local` / `.env.*.local` / `.env` (walks up from cwd) | see `.env.example` |
| 4 | `./leonardo.config.json` (walks up from cwd) | see `leonardo.config.example.json` |
| 5 | User config: `$XDG_CONFIG_HOME/leonardo-cli/config.json` (default `~/.config/leonardo-cli/config.json`) | written by `leonardo config set` |

Inspect what was resolved:

```bash
leonardo config path        # paths + which source the key came from
leonardo config show        # effective config (key redacted)
leonardo config set apiKey lk_xxx
```

## Output

Single file:

```bash
leonardo generate "a sunset" -o sunset.png
```

Directory (auto-named: `leonardo-<id>-NN.png`):

```bash
leonardo generate "a sunset" -d ./outputs -n 4
```

Skip download (URLs only):

```bash
leonardo generate "a sunset" --no-download --json
```

Default output dir falls back to `LEONARDO_OUTPUT_DIR` env, then `outputDir` in config, then `.`.

## Commands

| Command | Description |
|---|---|
| `generate <prompt>` (`gen`) | Text-to-image with polling and download |
| `video <prompt>` | Text-to-video (Motion / Veo / etc.) — returns a job id |
| `upscale <imageId>` | Universal Upscaler |
| `variation <variationId>` | Fetch upscale/variation result |
| `status <generationId>` | Check status + image URLs |
| `models` | List platform models (`id\tname`) |
| `me` | Account info + remaining API credits |
| `config get/set/path/show` | Manage config |

Run `leonardo <command> --help` for full options.

### Generate options

```
-m, --model <id>        Model UUID
-w, --width <n>         Image width  (default 1024)
-h, --height <n>        Image height (default 1024)
-n, --num <n>           Number of images
--alchemy               Enable Alchemy
--ultra                 Enable Ultra mode
--contrast <n>          Contrast (1.0-4.5)
--style <uuid>          Style UUID
--seed <n>              Seed
--negative <text>       Negative prompt
--enhance               Auto-enhance prompt
-o, --output <file>     Output file (or directory)
-d, --output-dir <dir>  Output directory
--no-download           Skip downloading; print URLs only
--wait-timeout <ms>     Polling timeout (default 480000)
```

## AI-agent mode (`--json`)

Pass `--json` (or `LEONARDO_JSON=1`) to emit a single JSON object on `stdout`. All progress goes to `stderr`; colors are disabled.

```bash
$ leonardo generate "a cat" --json | jq '.images[0].path'
"./leonardo-4f8e0a2b-01.png"
```

Sample shape:

```json
{
  "ok": true,
  "generationId": "4f8e0a2b-...",
  "status": "COMPLETE",
  "prompt": "a cat",
  "model": "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
  "width": 1024,
  "height": 1024,
  "images": [
    { "id": "...", "url": "https://...", "path": "./leonardo-...-01.png", "bytes": 812345 }
  ]
}
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic failure |
| 2 | Usage / argument error |
| 3 | Missing or invalid auth |
| 4 | Leonardo API error |
| 5 | Polling timeout |

### Streams

- `stdout` — JSON object (in `--json` mode), or primary data (URLs, IDs)
- `stderr` — human progress, warnings, errors

This separation lets you safely pipe stdout into `jq` / shell scripts without contaminating it.

## Development

```bash
bun run dev <command>   # run from source
bun run typecheck       # tsc --noEmit
bun run build           # produce dist/cli.js (single file)
```

Project layout:

```
src/
  cli.ts                  # commander entry
  config/                 # api-key + config resolution
    paths.ts
    schema.ts
    load-dotenv.ts
    resolve.ts
  api/
    client.ts             # fetch wrapper
    types.ts
  utils/
    log.ts                # JSON-aware logger
    poll.ts               # status polling
    output.ts             # download + filename utils
  commands/
    generate.ts video.ts upscale.ts status.ts
    models.ts me.ts config.ts
```

## License

MIT © mrgoonie

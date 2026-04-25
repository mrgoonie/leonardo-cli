#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerate } from "./commands/generate.ts";
import { registerStatus } from "./commands/status.ts";
import { registerMe } from "./commands/me.ts";
import { registerModels } from "./commands/models.ts";
import { registerUpscale } from "./commands/upscale.ts";
import { registerVideo } from "./commands/video.ts";
import { registerVideoModels } from "./commands/video-models.ts";
import { registerConfig } from "./commands/config.ts";
import { LeonardoApiError } from "./api/client.ts";
import { log } from "./utils/log.ts";

const program = new Command();

program
  .name("leonardo")
  .description(
    "Leonardo.Ai CLI — generate images, videos, upscale, and more.\n" +
      "AI-agent friendly (--json) and human friendly (colors + progress).",
  )
  .version("0.1.0")
  .option("-k, --api-key <key>", "Leonardo API key (overrides env/config)")
  .option("--base-url <url>", "Leonardo API base URL")
  .option("--json", "Emit machine-readable JSON to stdout (agent mode)", false)
  .option("-q, --quiet", "Suppress non-essential stderr output", false);

registerGenerate(program);
registerVideo(program);
registerVideoModels(program);
registerUpscale(program);
registerStatus(program);
registerModels(program);
registerMe(program);
registerConfig(program);

program.addHelpText(
  "after",
  `
Examples:
  $ leonardo generate "a cyberpunk cat" -o cat.png
  $ leonardo generate "a cyberpunk cat" --json | jq '.images[].path'
  $ leonardo me
  $ leonardo models --limit 5
  $ leonardo config set apiKey lk_...
  $ leonardo config path

API key resolution (first match wins):
  1. --api-key flag
  2. LEONARDO_API_KEY env var
  3. .env / .env.local in project (walks up)
  4. ./leonardo.config.json (walks up)
  5. \$XDG_CONFIG_HOME/leonardo-cli/config.json (default ~/.config/leonardo-cli/config.json)

Exit codes: 0 ok | 2 usage | 3 missing/invalid auth | 4 API error | 5 timeout`,
);

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof LeonardoApiError) {
    log.error(`API error ${err.status}: ${err.message}`);
    process.exit(err.status === 401 || err.status === 403 ? 3 : 4);
  }
  log.error((err as Error).message ?? String(err));
  process.exit(1);
});

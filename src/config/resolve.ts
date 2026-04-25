import { readFileSync, existsSync } from "node:fs";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL_ID,
  DEFAULT_OUTPUT_DIR,
  type LeonardoConfig,
  type ResolvedConfig,
} from "./schema.ts";
import { loadDotenvFiles } from "./load-dotenv.ts";
import { projectConfigPath, userConfigPath } from "./paths.ts";

export interface ResolveOptions {
  apiKey?: string;
  baseUrl?: string;
  outputDir?: string;
  cwd?: string;
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

// Resolve API key + config in this order (first wins):
//   1. CLI flag (--api-key)
//   2. process.env.LEONARDO_API_KEY (covers OS-level shell env)
//   3. .env* files (project, walk up)
//   4. Project leonardo.config.json (walk up)
//   5. User config: $XDG_CONFIG_HOME/leonardo-cli/config.json
export function resolveConfig(opts: ResolveOptions = {}): ResolvedConfig {
  const cwd = opts.cwd ?? process.cwd();
  const sources: string[] = [];

  // 5: user
  const userPath = userConfigPath();
  const userCfg = existsSync(userPath) ? readJson<LeonardoConfig>(userPath) : null;
  if (userCfg) sources.push(userPath);

  // 4: project
  const projPath = projectConfigPath(cwd);
  const projCfg = projPath ? readJson<LeonardoConfig>(projPath) : null;
  if (projCfg && projPath) sources.push(projPath);

  // 3: dotenv
  const { values: envFromFiles, files: envFiles } = loadDotenvFiles(cwd);
  if (envFiles.length > 0) sources.push(...envFiles);

  // Merged config (cli > project > user — defaults)
  const merged: LeonardoConfig = {
    ...userCfg,
    ...projCfg,
    defaults: { ...userCfg?.defaults, ...projCfg?.defaults },
  };

  // Resolve apiKey
  let apiKey: string | undefined;
  let apiKeySource = "none";

  if (opts.apiKey && opts.apiKey.length > 0) {
    apiKey = opts.apiKey;
    apiKeySource = "--api-key flag";
  } else if (process.env["LEONARDO_API_KEY"]) {
    apiKey = process.env["LEONARDO_API_KEY"];
    apiKeySource = "env:LEONARDO_API_KEY";
  } else if (envFromFiles["LEONARDO_API_KEY"]) {
    apiKey = envFromFiles["LEONARDO_API_KEY"];
    apiKeySource = `dotenv (${envFiles[0] ?? ".env"})`;
  } else if (projCfg?.apiKey) {
    apiKey = projCfg.apiKey;
    apiKeySource = `project:${projPath}`;
  } else if (userCfg?.apiKey) {
    apiKey = userCfg.apiKey;
    apiKeySource = `user:${userPath}`;
  }

  // Resolve baseUrl + outputDir similarly
  const baseUrl =
    opts.baseUrl ||
    process.env["LEONARDO_BASE_URL"] ||
    envFromFiles["LEONARDO_BASE_URL"] ||
    merged.baseUrl ||
    DEFAULT_BASE_URL;

  const outputDir =
    opts.outputDir ||
    process.env["LEONARDO_OUTPUT_DIR"] ||
    envFromFiles["LEONARDO_OUTPUT_DIR"] ||
    merged.outputDir ||
    DEFAULT_OUTPUT_DIR;

  return {
    apiKey: apiKey ?? "",
    baseUrl,
    outputDir,
    defaults: {
      modelId: merged.defaults?.modelId ?? DEFAULT_MODEL_ID,
      width: merged.defaults?.width ?? 1024,
      height: merged.defaults?.height ?? 1024,
      numImages: merged.defaults?.numImages ?? 1,
    },
    source: { apiKey: apiKeySource, config: sources },
  };
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "No Leonardo API key found. Provide one via --api-key, LEONARDO_API_KEY env var, .env file, or `leonardo config set apiKey <key>`."
    );
    this.name = "MissingApiKeyError";
  }
}

export function requireApiKey(cfg: ResolvedConfig): asserts cfg is ResolvedConfig {
  if (!cfg.apiKey) throw new MissingApiKeyError();
}

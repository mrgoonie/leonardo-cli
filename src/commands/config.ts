import { Command } from "commander";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { configureLogger, log, emit } from "../utils/log.ts";
import { resolveConfig } from "../config/resolve.ts";
import { userConfigPath, projectConfigPath } from "../config/paths.ts";
import type { LeonardoConfig } from "../config/schema.ts";

function readUserCfg(): LeonardoConfig {
  const p = userConfigPath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) as LeonardoConfig;
  } catch {
    return {};
  }
}

function writeUserCfg(cfg: LeonardoConfig): string {
  const p = userConfigPath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
  return p;
}

function setNested(obj: Record<string, unknown>, dotted: string, value: unknown): void {
  const parts = dotted.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    const next = cur[k];
    if (typeof next !== "object" || next === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function getNested(obj: Record<string, unknown>, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>((acc, k) => {
    if (typeof acc === "object" && acc !== null && k in (acc as object))
      return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function registerConfig(program: Command): void {
  const cmd = program.command("config").description("Manage Leonardo CLI configuration");

  cmd
    .command("path")
    .description("Print config file paths and resolution sources")
    .action(() => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = resolveConfig({});
      emit(
        {
          ok: true,
          userConfig: userConfigPath(),
          projectConfig: projectConfigPath() ?? null,
          resolved: {
            apiKeyPresent: !!cfg.apiKey,
            apiKeySource: cfg.source.apiKey,
            baseUrl: cfg.baseUrl,
            outputDir: cfg.outputDir,
            sources: cfg.source.config,
          },
        },
        () => {
          process.stdout.write(`user:    ${userConfigPath()}\n`);
          process.stdout.write(`project: ${projectConfigPath() ?? "(none)"}\n`);
          process.stderr.write(`apiKey:  ${cfg.apiKey ? "set" : "missing"} (${cfg.source.apiKey})\n`);
          process.stderr.write(`baseUrl: ${cfg.baseUrl}\n`);
        },
      );
    });

  cmd
    .command("get <key>")
    .description("Get a config value (e.g. apiKey, baseUrl, defaults.modelId)")
    .action((key: string) => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = readUserCfg();
      const value = getNested(cfg as Record<string, unknown>, key);
      emit({ ok: true, key, value: value ?? null }, () => {
        process.stdout.write(`${value ?? ""}\n`);
      });
    });

  cmd
    .command("set <key> <value>")
    .description("Set a config value in the user config file")
    .action((key: string, raw: string) => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = readUserCfg();
      let parsed: unknown = raw;
      if (raw === "true") parsed = true;
      else if (raw === "false") parsed = false;
      else if (/^-?\d+(\.\d+)?$/.test(raw)) parsed = Number(raw);
      setNested(cfg as Record<string, unknown>, key, parsed);
      const written = writeUserCfg(cfg);
      log.success(`Saved ${key} → ${written}`);
      emit({ ok: true, file: written, key, value: parsed }, () => {});
    });

  cmd
    .command("show")
    .description("Show effective resolved config (with secrets redacted)")
    .action(() => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = resolveConfig({});
      const redacted = {
        ...cfg,
        apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 4)}…${cfg.apiKey.slice(-4)}` : "",
      };
      emit({ ok: true, config: redacted }, () => {
        process.stdout.write(JSON.stringify(redacted, null, 2) + "\n");
      });
    });
}

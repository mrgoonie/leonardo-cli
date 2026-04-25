import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";
import type { ListPlatformModelsResponse } from "../api/types.ts";

export function registerModels(program: Command): void {
  program
    .command("models")
    .description("List Leonardo platform models")
    .option("--limit <n>", "Limit number of results", (v) => parseInt(v, 10))
    .action(async (options) => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = resolveConfig({
        apiKey: program.opts()["apiKey"],
        baseUrl: program.opts()["baseUrl"],
      });
      try {
        requireApiKey(cfg);
      } catch (e) {
        log.error((e as Error).message);
        process.exit(3);
      }
      const client = new LeonardoClient(cfg);
      const res = await client.get<ListPlatformModelsResponse>("/platformModels");
      const models = options.limit ? res.custom_models.slice(0, options.limit) : res.custom_models;
      emit(
        { ok: true, count: models.length, models },
        () => {
          for (const m of models) {
            process.stdout.write(`${m.id}\t${m.name}\n`);
          }
        },
      );
    });
}

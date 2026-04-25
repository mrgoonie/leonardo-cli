import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";
import type { GetGenerationResponse } from "../api/types.ts";

export function registerStatus(program: Command): void {
  program
    .command("status <generationId>")
    .description("Get a generation's status and image URLs")
    .action(async (generationId: string) => {
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
      const res = await client.get<GetGenerationResponse>(`/generations/${generationId}`);
      const gen = res.generations_by_pk;
      emit(
        { ok: true, generation: gen },
        () => {
          if (!gen) {
            log.warn("No generation found.");
            return;
          }
          process.stderr.write(`status: ${gen.status}\n`);
          for (const img of gen.generated_images ?? []) {
            process.stdout.write(`${img.url}\n`);
          }
        },
      );
    });
}

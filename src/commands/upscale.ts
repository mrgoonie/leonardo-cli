import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";

interface UpscaleResponse {
  universalUpscaler: { id: string; apiCreditCost?: number };
}

interface UpscaleVariationStatus {
  generated_image_variation_generic: Array<{
    id: string;
    status: string;
    url?: string;
    transformType?: string;
  }>;
}

export function registerUpscale(program: Command): void {
  program
    .command("upscale <generatedImageId>")
    .description("Upscale a generated image with Universal Upscaler")
    .option("--style <style>", "Upscaler style (GENERAL, CINEMATIC, ...)", "GENERAL")
    .option("--strength <n>", "Creativity strength (0-1)", (v) => parseFloat(v), 0.35)
    .option("--multiplier <n>", "Upscale multiplier (1-2)", (v) => parseFloat(v), 1.5)
    .action(async (generatedImageId: string, options) => {
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

      log.info(`Submitting upscale for image ${generatedImageId}`);
      const res = await client.post<UpscaleResponse>("/variations/universal-upscaler", {
        generatedImageId,
        upscalerStyle: options.style,
        creativityStrength: options.strength,
        upscaleMultiplier: options.multiplier,
      });
      const variationId = res.universalUpscaler.id;
      log.step(`variationId: ${variationId}`);

      emit(
        { ok: true, variationId, sourceImageId: generatedImageId },
        () => {
          process.stdout.write(`${variationId}\n`);
          process.stderr.write(`Use: leonardo variation ${variationId}\n`);
        },
      );
    });

  program
    .command("variation <variationId>")
    .description("Fetch a variation/upscale result by ID")
    .action(async (variationId: string) => {
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
      const res = await client.get<UpscaleVariationStatus>(`/variations/${variationId}`);
      emit(
        { ok: true, ...res },
        () => {
          for (const v of res.generated_image_variation_generic ?? []) {
            process.stdout.write(`${v.status}\t${v.url ?? ""}\n`);
          }
        },
      );
    });
}

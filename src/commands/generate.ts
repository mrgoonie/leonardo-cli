import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit, pc } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";
import type {
  CreateGenerationInput,
  CreateGenerationResponse,
  GetGenerationResponse,
} from "../api/types.ts";
import { poll } from "../utils/poll.ts";
import {
  autoFilename,
  downloadTo,
  extFromUrl,
  joinDirFile,
  resolveOutputTarget,
} from "../utils/output.ts";

export function registerGenerate(program: Command): void {
  program
    .command("generate")
    .alias("gen")
    .description("Generate images from a text prompt")
    .argument("<prompt>", "Text prompt")
    .option("-m, --model <id>", "Model UUID")
    .option("-w, --width <n>", "Image width", (v) => parseInt(v, 10))
    .option("-h, --height <n>", "Image height", (v) => parseInt(v, 10))
    .option("-n, --num <n>", "Number of images", (v) => parseInt(v, 10))
    .option("--alchemy", "Enable Alchemy")
    .option("--ultra", "Enable Ultra mode")
    .option("--contrast <n>", "Contrast", (v) => parseFloat(v))
    .option("--style <uuid>", "Style UUID")
    .option("--seed <n>", "Seed", (v) => parseInt(v, 10))
    .option("--negative <text>", "Negative prompt")
    .option("--enhance", "Enhance prompt")
    .option("--quality <level>", "GPT Image quality: LOW|MEDIUM|HIGH", "HIGH")
    .option("-o, --output <file>", "Output file (or directory)")
    .option("-d, --output-dir <dir>", "Output directory")
    .option("--no-download", "Skip downloading; print URLs only")
    .option("--wait-timeout <ms>", "Polling timeout ms", (v) => parseInt(v, 10))
    .action(async (prompt: string, options) => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = resolveConfig({
        apiKey: program.opts()["apiKey"],
        baseUrl: program.opts()["baseUrl"],
        outputDir: options.outputDir,
      });
      try {
        requireApiKey(cfg);
      } catch (err) {
        log.error((err as Error).message);
        process.exit(3);
      }

      const client = new LeonardoClient(cfg);
      const target = resolveOutputTarget({
        outputFile: options.output,
        outputDir: options.outputDir,
        fallbackDir: cfg.outputDir,
      });

      const input: CreateGenerationInput = {
        prompt,
        modelId: options.model ?? cfg.defaults.modelId,
        width: options.width ?? cfg.defaults.width,
        height: options.height ?? cfg.defaults.height,
        num_images: options.num ?? cfg.defaults.numImages,
        alchemy: options.alchemy,
        ultra: options.ultra,
        contrast: options.contrast,
        styleUUID: options.style,
        seed: options.seed,
        negative_prompt: options.negative,
        enhancePrompt: options.enhance,
      };

      log.info(`Submitting generation (${input.width}x${input.height}, n=${input.num_images})`);
      // GPT Image family uses the v2 endpoint with a different request shape.
      const isGptImage = typeof input.modelId === "string" && input.modelId.startsWith("gpt-image-");
      let generationId: string;
      try {
        if (isGptImage) {
          const v2Body = {
            public: false,
            model: input.modelId,
            parameters: {
              prompt: input.prompt,
              quantity: input.num_images ?? 1,
              width: input.width,
              height: input.height,
              quality: (options.quality as string | undefined) ?? "HIGH",
              prompt_enhance: input.enhancePrompt ? "ON" : "OFF",
              ...(input.seed !== undefined ? { seed: input.seed } : {}),
            },
          };
          const v2Res = await client.post<{ generate: { generationId: string } }>(
            "v2:/generations",
            v2Body,
          );
          generationId = v2Res.generate.generationId;
        } else {
          const createRes = await client.post<CreateGenerationResponse>("/generations", input);
          generationId = createRes.sdGenerationJob.generationId;
        }
      } catch (err) {
        log.error(`Failed to start generation: ${(err as Error).message}`);
        process.exit(4);
      }
      log.step(`generationId: ${generationId}`);
      log.info("Polling for completion...");

      const final = await poll<GetGenerationResponse>({
        fetch: () => client.get<GetGenerationResponse>(`/generations/${generationId}`),
        done: (v) =>
          v.generations_by_pk?.status === "COMPLETE" &&
          (v.generations_by_pk?.generated_images?.length ?? 0) > 0,
        failed: (v) => v.generations_by_pk?.status === "FAILED",
        intervalMs: 4000,
        maxAttempts: Math.ceil((options.waitTimeout ?? 480_000) / 4000),
        onTick: (attempt, v) =>
          log.step(`attempt ${attempt} — status: ${v.generations_by_pk?.status ?? "?"}`),
      }).catch((err) => {
        log.error(`Polling failed: ${(err as Error).message}`);
        process.exit(5);
      });

      const images = final.generations_by_pk?.generated_images ?? [];
      const downloaded: { url: string; path?: string; bytes?: number; id: string }[] = [];

      if (options.download === false) {
        for (const img of images) downloaded.push({ url: img.url, id: img.id });
      } else {
        for (let i = 0; i < images.length; i++) {
          const img = images[i]!;
          const ext = extFromUrl(img.url);
          const filename =
            target.file && images.length === 1
              ? target.file
              : autoFilename("leonardo", generationId, i + 1, ext);
          const filepath = joinDirFile(target.dir, filename);
          const bytes = await downloadTo(img.url, filepath).catch((err) => {
            log.warn(`Download failed for ${img.id}: ${(err as Error).message}`);
            return 0;
          });
          downloaded.push({ url: img.url, path: filepath, bytes, id: img.id });
          log.success(`Saved ${filepath} (${bytes} bytes)`);
        }
      }

      emit(
        {
          ok: true,
          generationId,
          status: final.generations_by_pk?.status,
          prompt,
          model: input.modelId,
          width: input.width,
          height: input.height,
          images: downloaded,
        },
        () => {
          process.stderr.write(`${pc.green("done")} ${downloaded.length} image(s)\n`);
        },
      );
    });
}

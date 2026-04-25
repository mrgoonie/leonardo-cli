import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";

interface CreateVideoResp {
  motionVideoGenerationJob?: { generationId: string; apiCreditCost?: number };
}

// v2 video models — string ids dispatched to /api/rest/v2/generations.
// v1 models (uppercase enums like MOTION2, VEO3, KLING2_1, Kling2_5) keep
// using /generations-text-to-video. Cross-reference: leo video-models.
const V2_VIDEO_MODELS = new Set([
  "kling-2.6",
  "kling-3.0",
  "kling-video-o-1",
  "kling-video-o-3",
  "hailuo-2_3",
  "ltxv-2.0-pro",
  "ltxv-2.3-pro",
  "seedance-2.0",
  "seedance-2.0-fast",
]);

export function registerVideo(program: Command): void {
  program
    .command("video <prompt>")
    .description("Generate a video from a text prompt (text-to-video)")
    .option("-m, --model <model>", "Video model (e.g. VEO3, MOTION2)", "MOTION2")
    .option("--resolution <r>", "Resolution (e.g. RESOLUTION_720)", "RESOLUTION_720")
    .option("--enhance", "Enable prompt enhance")
    .option("--frame-interpolation", "Enable frame interpolation")
    .action(async (prompt: string, options) => {
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

      log.info(`Submitting text-to-video (${options.model})`);
      let jobId: string | undefined;
      if (V2_VIDEO_MODELS.has(options.model)) {
        // v2 endpoint: nested parameters object, RESOLUTION_* via `mode`
        const w = options.resolution === "RESOLUTION_1080" ? 1920 : options.resolution === "RESOLUTION_480" ? 854 : 1280;
        const h = options.resolution === "RESOLUTION_1080" ? 1080 : options.resolution === "RESOLUTION_480" ? 480 : 720;
        const v2Res = await client.post<{ generate: { generationId: string } }>(
          "v2:/generations",
          {
            public: false,
            model: options.model,
            parameters: {
              prompt,
              duration: 8,
              mode: options.resolution,
              prompt_enhance: options.enhance ? "ON" : "OFF",
              width: w,
              height: h,
            },
          },
        );
        jobId = v2Res.generate.generationId;
      } else {
        const res = await client.post<CreateVideoResp>("/generations-text-to-video", {
          prompt,
          model: options.model,
          resolution: options.resolution,
          promptEnhance: !!options.enhance,
          frameInterpolation: !!options.frameInterpolation,
        });
        jobId = res.motionVideoGenerationJob?.generationId;
      }
      emit(
        { ok: true, generationId: jobId },
        () => {
          process.stdout.write(`${jobId ?? ""}\n`);
          process.stderr.write(`Poll with: leonardo status ${jobId}\n`);
        },
      );
    });
}

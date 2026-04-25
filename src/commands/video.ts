import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";

interface CreateVideoResp {
  motionVideoGenerationJob?: { generationId: string; apiCreditCost?: number };
}

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
      const res = await client.post<CreateVideoResp>("/generations-text-to-video", {
        prompt,
        model: options.model,
        resolution: options.resolution,
        promptEnhance: !!options.enhance,
        frameInterpolation: !!options.frameInterpolation,
      });
      const jobId = res.motionVideoGenerationJob?.generationId;
      emit(
        { ok: true, generationId: jobId, raw: res },
        () => {
          process.stdout.write(`${jobId ?? ""}\n`);
          process.stderr.write(`Poll with: leonardo status ${jobId}\n`);
        },
      );
    });
}

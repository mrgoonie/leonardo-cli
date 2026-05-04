import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit, pc } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";
import type { GetGenerationResponse } from "../api/types.ts";
import { poll } from "../utils/poll.ts";
import {
  autoFilename,
  downloadTo,
  extFromUrl,
  joinDirFile,
  resolveOutputTarget,
} from "../utils/output.ts";

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
    .option("-w, --wait", "Poll until video is ready (then download by default)")
    .option("--wait-timeout <ms>", "Polling timeout ms (used with --wait)", (v) => parseInt(v, 10))
    .option("--poll-interval <ms>", "Polling interval ms", (v) => parseInt(v, 10))
    .option("-o, --output <file>", "Output file (or directory) — single video only")
    .option("-d, --output-dir <dir>", "Output directory")
    .option("--no-download", "Skip downloading; print URLs only")
    .option("--no-thumbnail", "Skip downloading the JPG thumbnail")
    .action(async (prompt: string, options) => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      const cfg = resolveConfig({
        apiKey: program.opts()["apiKey"],
        baseUrl: program.opts()["baseUrl"],
        outputDir: options.outputDir,
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
      let apiCreditCost: number | undefined;
      if (V2_VIDEO_MODELS.has(options.model)) {
        // v2 endpoint: nested parameters object, RESOLUTION_* via `mode`
        const w = options.resolution === "RESOLUTION_1080" ? 1920 : options.resolution === "RESOLUTION_480" ? 854 : 1280;
        const h = options.resolution === "RESOLUTION_1080" ? 1080 : options.resolution === "RESOLUTION_480" ? 480 : 720;
        const v2Res = await client.post<{ generate: { generationId: string; apiCreditCost?: number } }>(
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
        apiCreditCost = v2Res.generate.apiCreditCost;
      } else {
        const res = await client.post<CreateVideoResp>("/generations-text-to-video", {
          prompt,
          model: options.model,
          resolution: options.resolution,
          promptEnhance: !!options.enhance,
          frameInterpolation: !!options.frameInterpolation,
        });
        jobId = res.motionVideoGenerationJob?.generationId;
        apiCreditCost = res.motionVideoGenerationJob?.apiCreditCost;
      }

      if (!jobId) {
        log.error("Submit succeeded but no generationId returned");
        process.exit(4);
      }

      if (apiCreditCost !== undefined) {
        log.step(`apiCreditCost: ${apiCreditCost}`);
      }

      // Without --wait: keep legacy behavior (print id + poll hint).
      if (!options.wait) {
        emit(
          { ok: true, generationId: jobId, apiCreditCost },
          () => {
            process.stdout.write(`${jobId}\n`);
            process.stderr.write(`Poll with: leonardo status ${jobId}\n`);
          },
        );
        return;
      }

      // --wait: poll until COMPLETE, then download mp4 (+ jpg thumbnail).
      const intervalMs = options.pollInterval ?? 8000;
      const timeoutMs = options.waitTimeout ?? 900_000; // 15 min default — videos are slow
      log.info("Polling for completion...");
      const final = await poll<GetGenerationResponse>({
        fetch: () => client.get<GetGenerationResponse>(`/generations/${jobId}`),
        done: (v) => v.generations_by_pk?.status === "COMPLETE" &&
          (v.generations_by_pk?.generated_images?.length ?? 0) > 0,
        failed: (v) => v.generations_by_pk?.status === "FAILED",
        intervalMs,
        maxAttempts: Math.ceil(timeoutMs / intervalMs),
        onTick: (attempt, v) =>
          log.step(`attempt ${attempt} — status: ${v.generations_by_pk?.status ?? "?"}`),
      }).catch((err) => {
        log.error(`Polling failed: ${(err as Error).message}`);
        process.exit(5);
      });

      const images = final.generations_by_pk?.generated_images ?? [];
      const target = resolveOutputTarget({
        outputFile: options.output,
        outputDir: options.outputDir,
        fallbackDir: cfg.outputDir,
      });

      const downloaded: {
        id: string;
        videoUrl?: string;
        thumbnailUrl?: string;
        videoPath?: string;
        thumbnailPath?: string;
        videoBytes?: number;
        thumbnailBytes?: number;
      }[] = [];

      const wantDownload = options.download !== false;
      const wantThumb = options.thumbnail !== false;

      for (let i = 0; i < images.length; i++) {
        const img = images[i]!;
        const entry: (typeof downloaded)[number] = {
          id: img.id,
          videoUrl: img.motionMP4URL,
          thumbnailUrl: img.url,
        };

        if (wantDownload && img.motionMP4URL) {
          const baseName =
            target.file && images.length === 1
              ? target.file.replace(/\.(mp4|jpg|jpeg|png|webp)$/i, "")
              : autoFilename("leonardo-video", jobId, i + 1, "").replace(/\.$/, "");
          const videoPath = joinDirFile(target.dir, `${baseName}.mp4`);
          const bytes = await downloadTo(img.motionMP4URL, videoPath).catch((err) => {
            log.warn(`Video download failed for ${img.id}: ${(err as Error).message}`);
            return 0;
          });
          entry.videoPath = videoPath;
          entry.videoBytes = bytes;
          if (bytes) log.success(`Saved ${videoPath} (${bytes} bytes)`);

          if (wantThumb && img.url) {
            const thumbExt = extFromUrl(img.url, ".jpg").replace(/^\./, "");
            const thumbPath = joinDirFile(target.dir, `${baseName}.${thumbExt}`);
            const tBytes = await downloadTo(img.url, thumbPath).catch((err) => {
              log.warn(`Thumbnail download failed for ${img.id}: ${(err as Error).message}`);
              return 0;
            });
            entry.thumbnailPath = thumbPath;
            entry.thumbnailBytes = tBytes;
            if (tBytes) log.success(`Saved ${thumbPath} (${tBytes} bytes)`);
          }
        }

        downloaded.push(entry);
      }

      emit(
        {
          ok: true,
          generationId: jobId,
          status: final.generations_by_pk?.status,
          apiCreditCost,
          prompt,
          model: options.model,
          resolution: options.resolution,
          videos: downloaded,
        },
        () => {
          process.stderr.write(`${pc.green("done")} ${downloaded.length} video(s)\n`);
        },
      );
    });
}

import { Command } from "commander";
import { configureLogger, emit } from "../utils/log.ts";

// Leonardo video models are hardcoded enums (not API-driven). Sourced from
// https://docs.leonardo.ai/llms.txt — keep in sync as Leonardo adds models.
// `mode` reflects the API endpoint(s) the model accepts:
//   t2v = /generations-text-to-video, i2v = /generations-image-to-video
const VIDEO_MODELS = [
  { id: "MOTION2", name: "Motion 2.0", modes: ["t2v", "i2v"] },
  { id: "MOTION2FAST", name: "Motion 2.0 Fast", modes: ["t2v", "i2v"] },
  { id: "VEO3", name: "Veo 3.0", modes: ["t2v", "i2v"] },
  { id: "VEO3FAST", name: "Veo 3.0 Fast", modes: ["t2v"] },
  { id: "VEO3_1", name: "Veo 3.1", modes: ["t2v", "i2v"] },
  { id: "KLING2_1", name: "Kling 2.1 Pro", modes: ["t2v", "i2v"] },
  { id: "Kling2_5", name: "Kling 2.5 Turbo", modes: ["t2v", "i2v"] },
  { id: "kling-2.6", name: "Kling 2.6", modes: ["t2v", "i2v"] },
  { id: "kling-3.0", name: "Kling 3.0", modes: ["t2v"] },
  { id: "kling-video-o-1", name: "Kling O1", modes: ["t2v", "i2v"] },
  { id: "kling-video-o-3", name: "Kling O3", modes: ["t2v", "i2v"] },
  { id: "hailuo-2_3", name: "Hailuo 2.3", modes: ["t2v", "i2v"] },
  { id: "ltxv-2.0-pro", name: "LTX 2.0 Pro", modes: ["t2v", "i2v"] },
  { id: "ltxv-2.3-pro", name: "LTX 2.3 Pro", modes: ["t2v", "i2v"] },
  { id: "seedance-2.0", name: "Seedance 2.0", modes: ["t2v", "i2v"] },
  { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", modes: ["t2v", "i2v"] },
] as const;

const RESOLUTIONS = ["RESOLUTION_480", "RESOLUTION_720", "RESOLUTION_1080"] as const;

export function registerVideoModels(program: Command): void {
  program
    .command("video-models")
    .description("List supported video models (static enum from Leonardo docs)")
    .action(() => {
      configureLogger({ json: !!program.opts()["json"], quiet: !!program.opts()["quiet"] });
      emit(
        { ok: true, models: VIDEO_MODELS, resolutions: RESOLUTIONS },
        () => {
          for (const m of VIDEO_MODELS) {
            process.stdout.write(`${m.id}\t${m.name}\t[${m.modes.join(",")}]\n`);
          }
          process.stderr.write(`\nResolutions: ${RESOLUTIONS.join(", ")}\n`);
          process.stderr.write(`Source: https://docs.leonardo.ai/llms.txt\n`);
        },
      );
    });
}

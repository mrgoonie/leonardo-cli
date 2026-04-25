// Subset of Leonardo.Ai API types — only what the CLI uses.

export interface CreateGenerationInput {
  prompt: string;
  modelId?: string;
  width?: number;
  height?: number;
  num_images?: number;
  alchemy?: boolean;
  ultra?: boolean;
  contrast?: number;
  styleUUID?: string;
  guidance_scale?: number;
  negative_prompt?: string;
  seed?: number;
  presetStyle?: string;
  enhancePrompt?: boolean;
  public?: boolean;
}

export interface CreateGenerationResponse {
  sdGenerationJob: {
    generationId: string;
    apiCreditCost?: number;
  };
}

export interface GenerationImage {
  id: string;
  url: string;
  nsfw?: boolean;
  likeCount?: number;
}

export interface Generation {
  id: string;
  status: "PENDING" | "COMPLETE" | "FAILED" | string;
  prompt?: string;
  modelId?: string;
  imageHeight?: number;
  imageWidth?: number;
  generated_images?: GenerationImage[];
}

export interface GetGenerationResponse {
  generations_by_pk: Generation | null;
}

export interface UserInfo {
  user_details: Array<{
    user: { id: string; username: string };
    subscriptionTokens: number;
    subscriptionGptTokens: number;
    subscriptionModelTokens: number;
    apiCredit?: number;
    apiPlanTokenRenewalDate?: string;
  }>;
}

export interface PlatformModel {
  id: string;
  name: string;
  description?: string;
  baseModel?: string;
}

export interface ListPlatformModelsResponse {
  custom_models: PlatformModel[];
}

export interface CreateTextToVideoInput {
  prompt: string;
  model: string; // e.g., "VEO3", "MOTION2"
  resolution?: string; // e.g., "RESOLUTION_720"
  frameInterpolation?: boolean;
  promptEnhance?: boolean;
}

export interface CreateVideoResponse {
  motionVideoGenerationJob?: { generationId: string; apiCreditCost?: number };
  // Some endpoints return shapes like sdGenerationJob — keep loose:
  [k: string]: unknown;
}

export interface UpscaleInput {
  generatedImageId?: string;
  initImageId?: string;
  variationImageId?: string;
  upscalerStyle?: string; // GENERAL | 2D ART AND ILLUSTRATION | CINEMATIC | etc.
  creativityStrength?: number;
  upscaleMultiplier?: number;
}

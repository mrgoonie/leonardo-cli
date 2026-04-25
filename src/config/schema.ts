export interface LeonardoConfig {
  apiKey?: string;
  baseUrl?: string;
  outputDir?: string;
  defaults?: {
    modelId?: string;
    width?: number;
    height?: number;
    numImages?: number;
  };
}

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  outputDir: string;
  defaults: NonNullable<LeonardoConfig["defaults"]>;
  source: {
    apiKey: string;   // where the api key was loaded from
    config: string[]; // list of config sources merged
  };
}

export const DEFAULT_BASE_URL = "https://cloud.leonardo.ai/api/rest/v1";
export const DEFAULT_OUTPUT_DIR = ".";
// Lucid Origin — fast, broadly available default
export const DEFAULT_MODEL_ID = "6b645e3a-d64f-4341-a6d8-7a3690fbf042";

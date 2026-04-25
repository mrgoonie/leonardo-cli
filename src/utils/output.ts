import { mkdirSync, existsSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve, basename } from "node:path";

export interface OutputTarget {
  // Resolved directory where files will be written
  dir: string;
  // If single output file requested via -o, this is its basename (else null)
  file: string | null;
}

// Resolve `-o` / `-d` semantics:
//   - If outputFile points to an existing dir, treat as dir.
//   - If outputFile is given and not a dir → single file output.
//   - Else use outputDir (default "." or config).
export function resolveOutputTarget(args: {
  outputFile?: string;
  outputDir?: string;
  fallbackDir: string;
}): OutputTarget {
  const { outputFile, outputDir, fallbackDir } = args;

  if (outputFile) {
    const abs = resolve(outputFile);
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      return { dir: abs, file: null };
    }
    const dir = dirname(abs);
    mkdirSync(dir, { recursive: true });
    return { dir, file: basename(abs) };
  }
  const dir = resolve(outputDir ?? fallbackDir);
  mkdirSync(dir, { recursive: true });
  return { dir, file: null };
}

// Generate filename like: leonardo-<id>-<idx>.<ext>
export function autoFilename(
  prefix: string,
  id: string,
  index: number,
  ext: string,
): string {
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  return `${prefix}-${id.slice(0, 8)}-${String(index).padStart(2, "0")}${e}`;
}

export function extFromUrl(url: string, fallback = ".png"): string {
  try {
    const u = new URL(url);
    const e = extname(u.pathname);
    return e.length > 0 ? e : fallback;
  } catch {
    return fallback;
  }
}

export async function downloadTo(url: string, filepath: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(filepath), { recursive: true });
  await writeFile(filepath, buf);
  return buf.length;
}

export function joinDirFile(dir: string, file: string): string {
  return join(dir, file);
}

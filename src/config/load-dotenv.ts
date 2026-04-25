import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

// Minimal .env parser — KEY=VALUE, supports quotes and # comments.
// We don't pull in `dotenv` to keep deps lean.
export function parseDotenv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

// Load env from .env files in priority order. Files earlier in the list win.
// Returns merged values (without mutating process.env, caller decides).
export function loadDotenvFiles(startDir: string = process.cwd()): {
  values: Record<string, string>;
  files: string[];
} {
  const filenames = [".env.local", ".env.development.local", ".env.production.local", ".env"];
  const found: string[] = [];
  const merged: Record<string, string> = {};

  // Walk from startDir upward, but stop at first directory containing any .env file
  // to avoid scooping random user-wide envs from $HOME unintentionally.
  let dir = resolve(startDir);
  while (true) {
    const hits = filenames.filter((f) => existsSync(join(dir, f)));
    if (hits.length > 0) {
      // Higher-priority files in `filenames` order win — fill only if not set.
      for (const f of hits) {
        const path = join(dir, f);
        found.push(path);
        try {
          const parsed = parseDotenv(readFileSync(path, "utf8"));
          for (const [k, v] of Object.entries(parsed)) {
            if (!(k in merged)) merged[k] = v;
          }
        } catch {
          // ignore unreadable files
        }
      }
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { values: merged, files: found };
}

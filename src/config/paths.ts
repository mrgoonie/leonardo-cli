import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { existsSync } from "node:fs";

export const PROJECT_CONFIG_NAME = "leonardo.config.json";
export const USER_CONFIG_DIR_NAME = "leonardo-cli";

export function userConfigDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".config");
  return join(base, USER_CONFIG_DIR_NAME);
}

export function userConfigPath(): string {
  return join(userConfigDir(), "config.json");
}

// Walk up from cwd looking for a file; return absolute path or null.
export function findUp(filename: string, startDir: string = process.cwd()): string | null {
  let dir = resolve(startDir);
  while (true) {
    const candidate = join(dir, filename);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function projectConfigPath(startDir?: string): string | null {
  return findUp(PROJECT_CONFIG_NAME, startDir);
}

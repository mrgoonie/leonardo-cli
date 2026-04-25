import pc from "picocolors";

export interface LogOptions {
  json: boolean;
  quiet: boolean;
}

let opts: LogOptions = { json: false, quiet: false };

export function configureLogger(o: Partial<LogOptions>): void {
  opts = { ...opts, ...o };
  if (opts.json) {
    // Disable picocolors in JSON mode — write plain stderr.
    (pc as unknown as { isColorSupported: boolean }).isColorSupported = false;
  }
}

export function isJsonMode(): boolean {
  return opts.json;
}

export function isQuiet(): boolean {
  return opts.quiet;
}

// stdout is reserved for JSON / primary data output.
// stderr is for human-readable progress.
export const log = {
  info(msg: string): void {
    if (opts.quiet || opts.json) return;
    process.stderr.write(`${pc.cyan("→")} ${msg}\n`);
  },
  step(msg: string): void {
    if (opts.quiet || opts.json) return;
    process.stderr.write(`  ${pc.dim(msg)}\n`);
  },
  success(msg: string): void {
    if (opts.json) return;
    process.stderr.write(`${pc.green("✓")} ${msg}\n`);
  },
  warn(msg: string): void {
    if (opts.json) return;
    process.stderr.write(`${pc.yellow("!")} ${msg}\n`);
  },
  error(msg: string): void {
    if (opts.json) {
      process.stderr.write(`${msg}\n`);
      return;
    }
    process.stderr.write(`${pc.red("✗")} ${msg}\n`);
  },
};

// Emit final structured output to stdout.
// In JSON mode: a single JSON object. Otherwise: human-readable summary or nothing.
export function emit(payload: unknown, humanRender?: () => void): void {
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else if (humanRender) {
    humanRender();
  }
}

export { pc };

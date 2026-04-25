import { Command } from "commander";
import { resolveConfig, requireApiKey } from "../config/resolve.ts";
import { configureLogger, log, emit } from "../utils/log.ts";
import { LeonardoClient } from "../api/client.ts";
import type { UserInfo } from "../api/types.ts";

export function registerMe(program: Command): void {
  program
    .command("me")
    .description("Show authenticated user info and remaining API credits")
    .action(async () => {
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
      const info = await client.get<UserInfo>("/me");
      emit(
        { ok: true, ...info },
        () => {
          const u = info.user_details?.[0];
          if (!u) {
            log.warn("No user info returned.");
            return;
          }
          process.stderr.write(
            `User: ${u.user.username} (${u.user.id})\n` +
              `Tokens: ${u.subscriptionTokens} | API credit: ${u.apiCredit ?? "n/a"}\n`,
          );
        },
      );
    });
}

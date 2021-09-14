import fsp from "fs/promises";
import { watch } from "chokidar";
import { Config, getConfig } from "../common/config";
import { Args, setupArgs } from "./args";
import { deployIfNecessary } from "./deploy";
import { refresh } from "./refresh";

async function main() {
  const args = await setupArgs();
  const c = await getConfig(args.config);
  const config: Config = {
    ...c,
    env: args.env ?? c.env,
    outDir: args.outDir ?? c.outDir,
  };
  fsp.mkdir(config.outDir, { recursive: true });
  const watcher = watch(config.watch, { ignored: config.ignore });
  await deployIfNecessary(config, watcher);
  console.log("Watching for source changes...");
  let timeouts: (NodeJS.Timeout | null)[][] = [];
  watcher.on("change", async () => {
    timeouts.forEach((t) => t.forEach((tx) => tx && clearInterval(tx)));
    timeouts = await refresh(config);
  });
}

main();

import fsp from "fs/promises";
import { watch } from "chokidar";
import { Config } from "../common/config";
import { setupArgs } from "./args";
import { deployIfNecessary, doDeploy } from "./deploy";
import { processLambdas } from "./lambda";
import { getConfig } from "./config";
import { emitKeypressEvents, createInterface } from "readline";
import merge from "deepmerge";
import chalk from "chalk";
import { tailLogs } from "./logs";

async function main() {
  const { args, config } = await getInputs();
  let tailTimeouts: (NodeJS.Timeout | null)[][] = [];
  const clearTailTimeouts = () =>
    tailTimeouts.forEach((t) => t.forEach((tx) => tx && clearInterval(tx)));

  fsp.mkdir(config.outDir, { recursive: true });
  const lambdaWatcher = watch(config.fly.watcher.watch, {
    ignored: config.fly.watcher.ignore,
  });
  const didDeploy = await deployIfNecessary(config, lambdaWatcher);
  console.info("Watching for source changes.");

  const refreshLambdas = async (doUpload: boolean) => {
    clearTailTimeouts();
    tailTimeouts = await processLambdas(doUpload, config);
  };

  const uploadRefreshLambdas = () => refreshLambdas(true);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", async function (ch, key) {
    if (
      (key?.ctrl && key?.name === "c") ||
      (!(key?.ctrl ?? false) && key?.name === "x")
    ) {
      process.exit();
    }
    if (!(key?.ctrl ?? false) && key?.name === "d") {
      console.info(chalk.bold(chalk.blue(chalk.bgBlack("Deploying"))));
      process.stdin.pause();
      lambdaWatcher.off("change", uploadRefreshLambdas);
      clearTailTimeouts();
      doDeploy(config);
      lambdaWatcher.on("change", uploadRefreshLambdas);
      await refreshLambdas(false);
      process.stdin.resume();
    }
  });
  lambdaWatcher.on("change", uploadRefreshLambdas);
  refreshLambdas(!didDeploy);
}

async function getInputs() {
  const args = await setupArgs();
  const c = await getConfig(args.config);
  const config: Config = {
    ...c,
    env: args.env ?? c.env,
    outDir: args.outDir ?? c.outDir,
    fly: {
      ...c.fly,
      synthArgs: merge(c.fly.synthArgs, (args["synth-args"] as string[]) ?? []),
      deployArgs: merge(
        c.fly.deployArgs,
        (args["deploy-args"] as string[]) ?? []
      ),
    },
  };
  return { args, config };
}

main();

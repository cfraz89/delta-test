import fsp from "fs/promises";
import { watch } from "chokidar";
import { Config } from "../common/config";
import { setupArgs } from "./dev/args";
import { deployIfNecessary, doDeploy } from "./dev/deploy";
import { lambdasNeedUploading, processLambdas } from "./dev/lambda";
import { getConfig } from "./dev/config";
import { emitKeypressEvents } from "readline";
import merge from "deepmerge";
import chalk from "chalk";
import { latestWatchedMtime } from "./dev/files";

async function main() {
  const config = await getMergedConfig();
  let tailTimeouts: NodeJS.Timeout[] = [];
  const clearTailTimeouts = () => tailTimeouts.forEach(clearInterval);

  fsp.mkdir(config.outDir, { recursive: true });
  const lambdaWatcher = watch(config.dev.watcher.watch, {
    ignored: config.dev.watcher.ignore,
  });
  const lambdaMTime = await latestWatchedMtime(lambdaWatcher);
  const didDeploy = await deployIfNecessary(config, lambdaMTime);
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
      console.info("Exiting");
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
  refreshLambdas(
    !didDeploy && (await lambdasNeedUploading(config, lambdaMTime))
  );
}

async function getMergedConfig() {
  const args = await setupArgs();
  const c = await getConfig(args.config);
  const config: Config = {
    ...c,
    outDir: args.outDir ?? c.outDir,
    dev: {
      ...c.dev,
      stage: args.stage ?? c.dev.stage,
      synthArgs: merge(c.dev.synthArgs, (args["synth-args"] as string[]) ?? []),
      deployArgs: merge(
        c.dev.deployArgs,
        (args["deploy-args"] as string[]) ?? []
      ),
    },
  };
  return config;
}

main();

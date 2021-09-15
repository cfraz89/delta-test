import fsp from "fs/promises";
import { watch } from "chokidar";
import { Config } from "../common/config";
import { setupArgs } from "./args";
import { deployIfNecessary, doDeploy } from "./deploy";
import { refresh } from "./refresh";
import { getConfig } from "./config";
import { emitKeypressEvents, createInterface } from "readline";
import merge from "deepmerge";
import chalk from "chalk";

async function main() {
  const { args, config } = await getInputs();
  let tailTimeouts: (NodeJS.Timeout | null)[][] = [];
  const clearTailTimeouts = () =>
    tailTimeouts.forEach((t) => t.forEach((tx) => tx && clearInterval(tx)));

  fsp.mkdir(config.outDir, { recursive: true });
  const lambdaWatcher = watch(config.fly.watcher.watch, {
    ignored: config.fly.watcher.ignore,
  });
  await deployIfNecessary(config, lambdaWatcher);
  console.info("Watching for source changes.");

  const refreshLambdas = async () => {
    clearTailTimeouts();
    tailTimeouts = await refresh(config);
  };
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", function (ch, key) {
    if (key && key.name === "d") {
      console.info(chalk.blueBright(chalk.bgBlack("Deploying")));
      process.stdin.pause();
      lambdaWatcher.off("change", refreshLambdas);
      clearTailTimeouts();
      doDeploy(config);
      lambdaWatcher.on("change", refreshLambdas);
      process.stdin.resume();
    }
  });
  lambdaWatcher.on("change", refreshLambdas);
  refreshLambdas();
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

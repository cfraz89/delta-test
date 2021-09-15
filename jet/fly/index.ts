import fsp from "fs/promises";
import { watch } from "chokidar";
import { Config } from "../common/config";
import { setupArgs } from "./args";
import { deployIfNecessary, doDeploy } from "./deploy";
import { refresh } from "./refresh";
import { getConfig } from "./config";
import merge from "deepmerge";

async function main() {
  const { args, config } = await getInputs();
  let tailTimeouts: (NodeJS.Timeout | null)[][] = [];
  const clearTailTimeouts = () =>
    tailTimeouts.forEach((t) => t.forEach((tx) => tx && clearInterval(tx)));

  fsp.mkdir(config.outDir, { recursive: true });
  const deployWatcher = watch(config.fly.watcher.deploy.watch, {
    ignored: config.fly.watcher.deploy.ignore,
  });
  const lambdaWatcher = watch(config.fly.watcher.lambda.watch, {
    ignored: config.fly.watcher.lambda.ignore,
  });
  if (args["force-deploy"]) {
    doDeploy(config);
  } else {
    await deployIfNecessary(config, deployWatcher);
  }
  console.log("Watching for source changes...");
  const refreshLambdas = async () => {
    clearTailTimeouts();
    tailTimeouts = await refresh(config);
  };
  deployWatcher.on("change", async () => {
    lambdaWatcher.off("change", refreshLambdas);
    clearTailTimeouts();
    doDeploy(config);
    lambdaWatcher.on("change", refreshLambdas);
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

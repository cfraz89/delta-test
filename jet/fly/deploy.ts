import { FSWatcher } from "chokidar";
import { Config } from "../common/config";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import { exit } from "process";
import { runCdk } from "./run";
import { stackFilter } from "./config";
import { Stack } from "./types";

async function latestWatchedMtime(watcher: FSWatcher) {
  return await new Promise<number>((resolve) => {
    watcher.on("ready", async () => {
      const watched = watcher.getWatched();
      const mtimes = await Promise.all(
        Object.entries(watched).map(
          async ([dir, files]) =>
            await Promise.all(
              files.map(async (file) => {
                try {
                  const stat = await fsp.stat(`${dir}${path.sep}${file}`);
                  return stat.mtimeMs;
                } catch (e) {
                  return 0;
                }
              })
            )
        )
      );
      resolve(Math.max(...mtimes.flatMap((t) => t)));
    });
  });
}

export function outFilePath(outDir: string) {
  return `${outDir}/cdk-outputs.json`;
}

export async function deployIfNecessary(
  config: Config,
  watcher: FSWatcher
): Promise<boolean> {
  let deploy = false;
  const outPath = outFilePath(config.outDir);
  try {
    if (!fs.existsSync(outPath)) {
      console.info("No deployment outputs file exists");
      deploy = true;
    } else {
      const outStat = await fsp.stat(outPath);
      if (outStat.mtimeMs < (await latestWatchedMtime(watcher))) {
        console.info("Source file has changed since last deploy");
        deploy = true;
      }
      const file = await fsp.readFile(outPath);
      const stacks: Record<string, Stack> = JSON.parse(file.toString());
      if (!Object.keys(stacks).length) {
        console.warn("Outputs file has no stacks");
        deploy = true;
      }
    }
  } catch (e) {
    console.error(`Error statting ${outFilePath}, giving up`);
    exit(0);
  }
  if (deploy) {
    doDeploy(config);
  } else {
    console.info("Outputs file up to date, skipping initial deploy");
  }
  return deploy;
}

export function doDeploy(config: Config) {
  const outPath = outFilePath(config.outDir);
  return runCdk(
    "deploy",
    ["-O", outPath, ...config.fly.deployArgs, stackFilter(config)],
    config.outDir
  );
}
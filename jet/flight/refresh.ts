import { Config } from "../common/config";
import { runCdk } from "./run";
import { Lambda } from "@aws-sdk/client-lambda";
import zip from "jszip";
import fsp from "fs/promises";
import { Function, Stack } from "./types";
import { outFilePath } from "./deploy";
import { tailLogs } from "./logs";

const lambda = new Lambda({});
export async function refresh(
  config: Config
): Promise<(NodeJS.Timeout | null)[][]> {
  runCdk("synth", config.env, config.synth, config.outDir);
  console.log("Uploading lambdas...");
  const stacks = await getStacks(config);
  return Promise.all(
    Object.values(stacks).map(async (stack) => {
      if (!stack.fns) {
        throw new Error("No fns in stack output!");
      }
      const fns: Function[] = await JSON.parse(stack.fns);
      return Promise.all(
        fns.map(async (fn) => {
          console.log(`Uploading ${fn.name}`);
          return upload(config, fn);
        })
      );
    })
  );
}

async function upload(config: Config, fn: Function) {
  const zipped = await makeZip(config, fn);
  if (zipped) {
    updateLambda(zipped, fn);
    return tailLogs(fn);
  } else {
    console.log("Failed to update");
    return null;
  }
}

async function makeZip(config: Config, fn: Function) {
  const assetPath = `${config.outDir}/cdk.out/${fn.path}`;
  const assetZip = new zip();
  const assetFilePaths = await fsp.readdir(assetPath);
  const assetFiles = await Promise.all(
    assetFilePaths
      .filter((f) => f.endsWith(".js"))
      .map(async (f) => ({
        path: f,
        contents: await fsp.readFile(`${assetPath}/${f}`),
      }))
  );
  assetFiles.forEach(({ path, contents }) => assetZip.file(path, contents));
  return await assetZip.generateAsync({
    type: "uint8array",
  });
}

async function updateLambda(zip: Uint8Array, fn: Function) {
  const response = await lambda.updateFunctionCode({
    FunctionName: fn.name,
    ZipFile: zip,
  });
  console.log(response.LastUpdateStatus);
}

async function getStacks(config: Config) {
  const outputsFile = await fsp.readFile(outFilePath(config.outDir), "utf-8");
  return JSON.parse(outputsFile) as Record<string, Stack>;
}

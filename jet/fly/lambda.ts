import { Config } from "../common/config";
import { runCdk } from "./run";
import { Lambda } from "@aws-sdk/client-lambda";
import zip from "jszip";
import fsp from "fs/promises";
import { Function, JetOutput, Stack } from "./types";
import { outFilePath } from "./deploy";
import { tailLogs } from "./logs";
import { stackFilter } from "./config";
import { Interface } from "readline";
import chalk from "chalk";
import { usagePrompt } from "./prompt";

const lambda = new Lambda({});
export async function processLambdas(
  doUpload: boolean,
  config: Config
): Promise<(NodeJS.Timeout | null)[][]> {
  if (doUpload) {
    runCdk(
      "synth",
      [...config.fly.synthArgs, stackFilter(config)],
      config.outDir
    );
    console.info("\nUploading lambdas...\n");
  }
  const stacks = await getStacks(config);
  if (!Object.keys(stacks).length) {
    console.info(chalk.bold("No stacks"));
    usagePrompt();
  }
  return Promise.all(
    Object.values(stacks).map(async (stack) => {
      if (!stack.jet) {
        console.error(
          "No jet value in stack output. Did you add the jet function to the end?"
        );
        return [null];
      }
      const jetOutput: JetOutput = await JSON.parse(stack.jet);
      console.info(chalk.bold("\nStack outputs (jet hidden):"));
      const { jet, ...rest } = stack;
      Object.entries(rest).forEach(([key, value]) => {
        console.info(chalk.blueBright(chalk.bgBlack(`${key}: ${value}`)));
      });
      console.log();
      return Promise.all(
        jetOutput.functions.map(async (fn) => {
          if (doUpload) {
            console.info(`Uploading ${fn.name}`);
            await upload(fn, jetOutput.assemblyOutDir);
          }
          return tailLogs(fn);
        })
      );
    })
  );
}

async function upload(fn: Function, assemblyOutDir: string) {
  const zipped = await makeZip(fn, assemblyOutDir);
  if (zipped) {
    return updateLambda(zipped, fn);
  } else {
    console.error("Failed to update");
    return null;
  }
}

async function makeZip(fn: Function, assemblyOutDir: string) {
  const assetPath = `${assemblyOutDir}/${fn.path}`;
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
  console.info(response.LastUpdateStatus);
}

async function getStacks(config: Config) {
  const outputsFile = await fsp.readFile(outFilePath(config.outDir), "utf-8");
  return JSON.parse(outputsFile) as Record<string, Stack>;
}
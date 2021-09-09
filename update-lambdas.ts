import { Lambda } from "@aws-sdk/client-lambda";
import fs from "fs/promises";
import { watch } from "chokidar";
import libnpmexec from "libnpmexec";
import zip from "jszip";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

const lambda = new Lambda({});
const refreshInterval = 1000;
interface Stack {
  fns: string;
}
interface Function {
  name: string;
  logicalId: string;
  arn: string;
}

async function getStacks() {
  const outputsFile = await fs.readFile("cdk-outputs.json", "utf-8");
  return JSON.parse(outputsFile) as Record<string, Stack>;
}

async function getResources(stack: string) {
  const stackFile = await fs.readFile(
    `cdk.out/${stack}.template.json`,
    "utf-8"
  );
  return JSON.parse(stackFile)["Resources"];
}

async function tailLogs(fn: Function) {
  const cw = new CloudWatchLogs({});
  let lastReceivedTimestamp = Date.now();
  return setInterval(async () => {
    try {
      const events = await cw.filterLogEvents({
        logGroupName: `/aws/lambda/${fn.name}`,
        startTime: lastReceivedTimestamp,
      });
      if (events.events && events.events.length > 0) {
        const recentEvents = events.events
          .filter((x) => (x.timestamp ?? 0) > lastReceivedTimestamp)
          .map((e) => `${new Date(e.timestamp!).toISOString()} - ${e.message}`);
        recentEvents?.forEach(console.log);
        lastReceivedTimestamp =
          events.events[events.events.length - 1].timestamp ??
          lastReceivedTimestamp;
      }
    } catch (e) {}
  }, refreshInterval);
}

async function synthAndUpload() {
  await libnpmexec({ args: ["cdk", "synth", "-q"] });
  console.log("Uploading lambdas...");
  const stacks = await getStacks();
  return Promise.all(
    Object.entries(stacks).map(async ([stackName, stack]) => {
      const resources = await getResources(stackName);
      const fns: Function[] = await JSON.parse(stack.fns);
      return Promise.all(
        fns.map(async (fn) => {
          console.log(`Uploading ${fn.name}`);
          const resource = resources[fn.logicalId];
          const path = resource.Metadata["aws:asset:path"];
          const assetPath = `cdk.out/${path}`;
          const assetZip = new zip();
          const assetFilePaths = await fs.readdir(assetPath);
          const assetFiles = await Promise.all(
            assetFilePaths
              .filter((f) => f.endsWith(".js"))
              .map(async (f) => ({
                path: f,
                contents: await fs.readFile(`${assetPath}/${f}`),
              }))
          );
          assetFiles.forEach(({ path, contents }) =>
            assetZip.file(path, contents)
          );
          const zipped = await assetZip.generateAsync({
            type: "uint8array",
          });
          if (zipped) {
            const response = await lambda.updateFunctionCode({
              FunctionName: fn.name,
              ZipFile: zipped,
            });
            console.log(response.LastUpdateStatus);
            return tailLogs(fn);
          } else {
            console.log("Failed to update");
            return null;
          }
        })
      );
    })
  );
}

async function main() {
  console.log("Performing initial deployment");
  await libnpmexec({ args: ["cdk", "deploy", "-O", "cdk-outputs.json"] });
  console.log("Synthesizing...");
  // synthAndUpload();
  let timeouts: (NodeJS.Timeout | null)[][] = [];
  watch("lib/**/*.ts").on("change", async () => {
    console.log("Change detected, synthesizing...");
    timeouts.forEach((t) => t.forEach((tx) => tx && clearInterval(tx)));
    timeouts = await synthAndUpload();
  });
  const stacks = await getStacks();
  Object.entries(stacks).forEach(async ([stackName, stack]) => {
    const fns: Function[] = await JSON.parse(stack.fns);
    fns.forEach(async (fn) => {
      tailLogs(fn);
    });
  });
}

main();

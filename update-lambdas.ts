import { Lambda } from "@aws-sdk/client-lambda";
import fs from "fs/promises";
import { watch } from "chokidar";
import libnpmexec from "libnpmexec";
import zip from "jszip";

const lambda = new Lambda({});

async function synthAndUpload() {
  await libnpmexec({ args: ["cdk", "synth", "-q"] });
  console.log("Uploading lambdas...");
  const outputsFile = await fs.readFile("cdk-outputs.json", "utf-8");
  const stacks = JSON.parse(outputsFile);
  Object.entries<{ fns: string }>(stacks).forEach(async ([stack, entry]) => {
    const stackFile = await fs.readFile(
      `cdk.out/${stack}.template.json`,
      "utf-8"
    );
    const resources = JSON.parse(stackFile)["Resources"];
    const fns = JSON.parse(entry.fns);
    await Promise.all(
      fns.map(async (fn: { name: string; logicalId: string; arn: string }) => {
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
        } else {
          console.log("Failed to update");
        }
      })
    );
  });
}

async function main() {
  console.log("Performing initial deployment");
  await libnpmexec({ args: ["cdk", "deploy", "-O", "cdk-outputs.json"] });
  console.log("Synthesizing...");
  synthAndUpload();
  watch("lib/**/*.ts").on("change", async () => {
    console.log("Change detected, synthesizing...");
    synthAndUpload();
  });
}

main();
// lambda.updateFunctionCode({ FunctionName });

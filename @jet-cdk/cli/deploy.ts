import { BaseConfigWithUserAndDeployStage } from "../common/config";
import { stackFilter } from "./core/config";
import { outFilePath, runCdk } from "./core/run-cdk";

export function runDeploy(config: BaseConfigWithUserAndDeployStage) {
  const outPath = outFilePath(config.outDir);
  return runCdk("deploy", {
    jetOutDir: config.outDir,
    args: [
      "-O",
      outPath,
      ...config.deploy.deployArgs,
      stackFilter(config.deploy.stage, { user: config.user }),
    ],
  });
}

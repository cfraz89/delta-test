import { BaseConfigWithUserAndDeployStage } from "../../common/config";
import { stackFilter } from "../core/config";
import { outFilePath, runCdk } from "../core/run-cdk";

export function runDeploy(config: BaseConfigWithUserAndDeployStage) {
  return runCdk("deploy", {
    jetOutDir: config.outDir,
    args: [
      ...config.deploy.deployArgs,
      stackFilter(config.deploy.stage, { user: config.user }),
    ],
  });
}

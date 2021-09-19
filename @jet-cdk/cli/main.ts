import {
  BaseConfig,
  BaseConfigWithUser,
  Config,
  loadConfig,
} from "../common/config";
import { Args, setupArgs } from "./core/args";
import merge from "deepmerge";
import cleanDeep from "clean-deep";
import chalk from "chalk";
import { listStages } from "./list-stages";
import { runDev } from "./dev";
import { runDeploy } from "./deploy";

export async function main(args: Args) {
  const config = await getMergedConfig(args);
  switch (args.command) {
    case "dev":
      if (checkDevStage(config)) {
        await runDev(config);
      }
      break;
    case "deploy":
      if (checkDeployStage(config)) {
        runDeploy(config);
      }
      break;
    case "list-stages":
      const stages = listStages(config.outDir, config.user);
      console.info(
        chalk.yellowBright(
          chalk.bgBlack(chalk.bold("Stages detected from cdk:"))
        )
      );
      stages.forEach((s) => {
        console.info(s);
      });
      break;
  }
}

/**
 * Combine config with args into a final config, and verify the stage
 * @param args
 * @returns
 */
async function getMergedConfig(args: Args): Promise<BaseConfigWithUser> {
  const c = await loadConfig(args.config);
  //The deep clean is important to make sure we dont overwrite values from the config with unset args
  const argsConfig = cleanDeep(
    {
      outDir: args.outDir,
      dev: {
        stage: args.stage,
        synthArgs: args.synthArgs,
        deployArgs: args.deployArgs,
      },
      deploy: {
        stage: args.stage,
        deployArgs: args.deployArgs,
      },
    },
    { undefinedValues: true }
  );
  return merge(c, argsConfig);
}

function checkDevStage(
  config: BaseConfigWithUser
): config is BaseConfigWithUser & { dev: { stage: string } } {
  return verifyStage(config, config.dev.stage);
}

function checkDeployStage(
  config: BaseConfigWithUser
): config is BaseConfigWithUser & { deploy: { stage: string } } {
  return verifyStage(config, config.deploy.stage);
}

function verifyStage(
  config: BaseConfigWithUser,
  stage: string | undefined
): boolean {
  const stages = listStages(config.outDir, config.user);
  let stageValid = true;
  if (!stage) {
    stageValid = false;
    console.error(
      chalk.redBright(
        chalk.bgBlack("No stage has been provided, from config or argument.")
      )
    );
    console.info("You may:");
    console.info("- Add stage to your configuration file");
    console.info("- Provide stage as an argument");
  }
  if (stage && !stages.includes(stage)) {
    stageValid = false;
    console.error(
      chalk.redBright(chalk.bgBlack(`Stage ${stage} isn't valid for this app!`))
    );
  }
  if (!stageValid) {
    console.info(
      chalk.yellowBright(chalk.bgBlack(chalk.bold("\nAvailable stages:")))
    );
    stages.forEach((s) => {
      console.info(s);
    });
  }
  return stageValid;
}

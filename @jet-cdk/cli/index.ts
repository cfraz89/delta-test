import { BaseConfig, Config, loadConfig } from "../common/config";
import { Args, setupArgs } from "./core/args";
import merge from "deepmerge";
import cleanDeep from "clean-deep";
import chalk from "chalk";
import { listStages } from "./list-stages";
import { runDev } from "./dev";

async function main() {
  const args = await setupArgs();
  const config = await getMergedConfig(args);
  switch (args._[0] ?? "dev") {
    case "dev":
      await runDev(config);
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
async function getMergedConfig(args: Args): Promise<Config> {
  const c = await loadConfig(args.config);
  //The deep clean is important to make sure we dont overwrite values from the config with unset args
  const argsConfig = cleanDeep(
    {
      outDir: args.outDir,
      dev: {
        stage: args.stage,
        synthArgs: args["synth-args"],
        deployArgs: args["deploy-args"],
      },
    },
    { undefinedValues: true }
  );
  const config: BaseConfig & Pick<Config, "user"> = merge(c, argsConfig);
  const stages = listStages(c.outDir, c.user);
  let stageError = false;
  if (!config.dev.stage) {
    stageError = true;
    console.error(
      chalk.redBright(
        chalk.bgBlack("No stage has been provided, from config or argument.")
      )
    );
    console.info("You may:");
    console.info(
      "- Add stage to your configuration file (probably .jetrc.json5)"
    );
    console.info("- Provide stage as an argument to `jet dev`");
  }
  if (config.dev.stage && !stages.includes(config.dev.stage)) {
    stageError = true;
    console.error(
      chalk.redBright(
        chalk.bgBlack(`Stage ${config.dev.stage} isn't valid for this app!`)
      )
    );
  }
  if (stageError) {
    console.info(
      chalk.yellowBright(chalk.bgBlack(chalk.bold("\nAvailable stages:")))
    );
    stages.forEach((s) => {
      console.info(s);
    });
    process.exit(0);
  }
  return config as Config;
}

main();

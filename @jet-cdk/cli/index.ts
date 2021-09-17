import { Config } from "../common/config";
import { Args, setupArgs } from "./core/args";
import { getConfig } from "./core/config";
import merge from "deepmerge";
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

async function getMergedConfig(args: Args): Promise<Config> {
  const c = await getConfig(args.config);
  const stage = args.stage ?? c.dev.stage;
  if (!stage) {
    console.error(
      chalk.redBright(
        chalk.bgBlack("No stage has been provided, from config or argument.")
      )
    );
    console.info("You may:");
    console.info(
      "- Add stage to your configuration file (probably .jetrc.json5)"
    );
    console.info("- Provide stage as an argument to `jet dev`\n");
    const stages = listStages(c.outDir, c.user);
    console.info(
      chalk.yellowBright(chalk.bgBlack(chalk.bold("Available stages:")))
    );
    stages.forEach((s) => {
      console.info(s);
    });
    process.exit(0);
  }
  const config: Config = {
    ...c,
    outDir: args.outDir ?? c.outDir,
    dev: {
      ...c.dev,
      stage,
      synthArgs: merge(
        c.dev.synthArgs as string[],
        (args["synth-args"] as string[]) ?? []
      ),
      deployArgs: merge(
        c.dev.deployArgs as string[],
        (args["deploy-args"] as string[]) ?? []
      ),
    },
  };
  return config;
}

main();

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Args = Await<ReturnType<typeof setupArgs>>;
type Await<T> = T extends Promise<infer U> | infer U ? U : never;

export function setupArgs() {
  return yargs(hideBin(process.argv))
    .command("dev [stage]", "Start development mode", (yargs) => {
      return yargs
        .positional("stage", {
          type: "string",
          description: "Stage to use for development",
        })
        .option("synth-args", {
          type: "array",
          description: "Extra arguments to cdk synth",
        })
        .option("deploy-args", {
          type: "array",
          description: "Extra arguments to cdk deploy",
        });
    })
    .command("deploy [stage]", "Deploy a stage", (yargs) => {
      return yargs
        .positional("stage", {
          type: "string",
          description: "Stage to use for development",
        })
        .option("deploy-args", {
          type: "array",
          description: "Extra arguments to cdk deploy",
        });
    })
    .command("list-stages", "List detected stages")
    .option("config", {
      alias: "c",
      type: "string",
      description: "Configuration file to read from",
    })
    .option("outDir", {
      alias: "o",
      type: "string",
      description: "Output directory for jet data [.jet]",
    }).argv;
}

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type Args = Await<ReturnType<typeof setupArgs>>;
type Await<T> = T extends Promise<infer U> | infer U ? U : never;

export function setupArgs() {
  return yargs(hideBin(process.argv))
    .option("stage", {
      alias: "s",
      type: "string",
      description: "Stage to run against. [dev-{user}]",
    })
    .option("config", {
      alias: "c",
      type: "string",
      description: "Configuration file to read from",
    })
    .option("outDir", {
      alias: "o",
      type: "string",
      description: "Output directory for jet data [.jet]",
    })
    .option("synth-args", {
      type: "array",
      description: "Extra arguments to cdk synth",
    })
    .option("deploy-args", {
      type: "array",
      description: "Extra arguments to cdk deploy",
    }).argv;
}

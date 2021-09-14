import child_process from "child_process";
import { Config } from "cosmiconfig/dist/types";
import npmRunPath from "npm-run-path";

export function runCdk(
  command: string,
  env: string,
  args: string[],
  jetOutDir: string,
  cwd?: string
) {
  const result = child_process.spawnSync(
    "cdk",
    [
      command,
      "-c",
      "jet=true",
      "-c",
      `jet-env=${env}`,
      "-o",
      `${jetOutDir}/cdk.out`,
      ...args,
    ],
    {
      cwd: cwd,
      //The ternary is necessary due to the nature of npmRunPath's property overwriting
      env: npmRunPath.env(cwd ? { cwd } : undefined),
      stdio: "inherit",
    }
  );
  if (result.status) {
    console.log("Problem deploying, ejecting!");
    process.exit(1);
  }
}

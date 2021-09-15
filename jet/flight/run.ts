import child_process from "child_process";
import { Config } from "cosmiconfig/dist/types";
import npmRunPath from "npm-run-path";

export function runCdk(
  command: string,
  args: string[],
  jetOutDir: string,
  cwd?: string,
  stdio?: child_process.StdioOptions
) {
  const result = child_process.spawnSync(
    "cdk",
    [command, "-c", "jet=true", "-o", `${jetOutDir}/cdk.out`, ...args],
    {
      cwd: cwd,
      //The ternary is necessary due to the nature of npmRunPath's property overwriting
      env: npmRunPath.env(cwd ? { cwd } : undefined),
      stdio: stdio ?? "inherit",
    }
  );
  console.log(result);
  console.log([
    command,
    "-c",
    "jet=true",
    "-o",
    `${jetOutDir}/cdk.out`,
    ...args,
  ]);
  if (result.status) {
    console.log("Problem running cdk, ejecting!");
    process.exit(1);
  }
  return result;
}

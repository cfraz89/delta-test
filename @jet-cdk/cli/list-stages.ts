import { Config } from "../common/config";
import { runCdk } from "./core/run-cdk";

export function listStages(outDir: string, user: string) {
  return runCdk("list", {
    jetOutDir: outDir,
    stdio: "pipe",
  })
    .stdout.toString()
    .trim()
    .split("\n")
    .map((s) => s.match(/.+\/(.+)\/.+/)?.[1]);
}

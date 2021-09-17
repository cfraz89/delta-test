import { Config } from "../common/config";
import { runCdk } from "./core/run-cdk";

export function listStages(outDir: string, user: string) {
  return runCdk("list", [], outDir, undefined, "pipe")
    .stdout.toString()
    .trim()
    .split("\n")
    .map((s) => s.match(/.+\/(.+)\/.+/)?.[1]);
}

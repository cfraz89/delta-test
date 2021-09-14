import { STS } from "@aws-sdk/client-sts";
import { cosmiconfigSync } from "cosmiconfig";
import fs from "fs/promises";
import os from "os";
import json5 from "json5";
import { Config, Defaults } from "../common/config";
export function getConfig(path: string | undefined): Config {
  const loadedConfig = loadConfig(path);
  return { ...Defaults, ...loadedConfig };
}

/**
 * Load configuration file
 */
async function loadConfig(path: string | undefined): Promise<Partial<Config>> {
  const explorer = cosmiconfigSync("jet", {
    loaders: { ".json5": (_path, content) => json5.parse(content) },
    searchPlaces: ["package.json", ".jetrc.json5", ".jetrc", ".jetrc.json"],
  });
  const result = path ? explorer.load(path) : explorer.search();
  if (!result?.config) {
    throw new Error("No config!");
  }
  return result?.config;
}

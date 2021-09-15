import { cosmiconfigSync } from "cosmiconfig";
import json5 from "json5";
import { Config, DefaultConfig } from "../common/config";
import os from "os";

export function getConfig(path: string | undefined): Config {
  const loadedConfig = loadConfig(path);
  return { ...DefaultConfig, ...loadedConfig };
}

/**
 * Load configuration file
 */
function loadConfig(path: string | undefined): Partial<Config> {
  const explorer = cosmiconfigSync("jet", {
    loaders: { ".json5": (_path, content) => json5.parse(content) },
    searchPlaces: ["package.json", ".jetrc.json5", ".jetrc", ".jetrc.json"],
  });
  const result = path ? explorer.load(path) : explorer.search();
  if (!result?.config) {
    console.log("No config! Using system username");
    return { user: os.userInfo().username };
  }
  return result?.config;
}

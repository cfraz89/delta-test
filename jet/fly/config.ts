import { STS } from "@aws-sdk/client-sts";
import { cosmiconfig } from "cosmiconfig";
import fs from "fs/promises";
import os from "os";
import json5 from "json5";
import { Config, DefaultConfigPath, DefaultConfig } from "../common/config";
import merge from "deepmerge";

export async function getConfig(path: string | undefined): Promise<Config> {
  const loadedConfig = await loadConfig(path);
  return merge(DefaultConfig, loadedConfig);
}

/**
 * Look for configuration file, load or create if it doesnt exist
 */

async function loadConfig(path: string | undefined): Promise<any> {
  const explorer = cosmiconfig("jet", {
    loaders: { ".json5": (_path, content) => json5.parse(content) },
    searchPlaces: ["package.json", ".jetrc.json5", ".jetrc", ".jetrc.json"],
  });
  const result = await (path ? explorer.load(path) : explorer.search());
  if (!result?.config) {
    console.log("Empty or no config. Creating one now...");
    const username = await getUserName();
    const config = {
      user: username,
      env: "dev-{user}",
      fly: {
        watcher: DefaultConfig.fly.watcher,
      },
    };
    await fs.writeFile(
      path ?? DefaultConfigPath,
      json5.stringify(config, undefined, 2)
    );
    return config;
  }
  return result?.config;
}

/**
 * Get the name of the user, first try iam, then if that fails, from os.
 * @returns username
 */
async function getUserName(): Promise<string> {
  let identityArn: string | undefined;
  try {
    identityArn = (await new STS({}).getCallerIdentity({})).Arn;
  } catch (e) {
    console.warn(`AWS Error: ${(e as Error).message}\n`);
    console.warn(
      "It appears your AWS profile is not set up. This would have been used to initialise your user name in the config, .jetrc.json5." +
        "Falling back to your OS username. You can change it in your config later if desired.\n"
    );
  }
  const iamUser = identityArn ? identityArn.split("/")[1] : undefined;
  return iamUser ?? os.userInfo().username;
}

export const stackFilter = (config: Config) =>
  config.env ? `*/${config.env.replace("{user}", config.user)}/*` : "";

import { STS } from "@aws-sdk/client-sts";
import { cosmiconfig } from "cosmiconfig";
import fs from "fs/promises";
import os from "os";
import json5 from "json5";
import { Config, DefaultConfigPath, DefaultConfig } from "../common/config";
export async function getConfig(path: string | undefined): Promise<Config> {
  const loadedConfig = await loadConfig(path);
  return { ...DefaultConfig, ...loadedConfig };
}

/**
 * Look for configuration file, load or create if it doesnt exist
 */
async function loadConfig(path: string | undefined): Promise<Partial<Config>> {
  const explorer = cosmiconfig("jet", {
    loaders: { ".json5": (_path, content) => json5.parse(content) },
    searchPlaces: ["package.json", ".jetrc.json5", ".jetrc", ".jetrc.json"],
  });
  const result = await (path ? explorer.load(path) : explorer.search());
  if (!result?.config) {
    console.log("Empty or no config. Creating one now...");
    const username = await getUserName();
    const config =
      // prettier-ignore
      `{
	user: '${username}',
	// These are the defaults, uncomment to override
	// env: "dev-{user}",
	// outDir: '.jet',
	// watch: "lib/**/*.ts",
	// ignore: "node_modules",
	// synth: ["-q"],
	// deploy: [],
}`;
    await fs.writeFile(path ?? DefaultConfigPath, config);
    return { user: username };
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
    console.log(`AWS Error: ${(e as Error).message}\n`);
    console.log(
      "It appears your AWS profile is not set up. This would have been used to initialise your user name in the config, .jetrc.json5." +
        "Falling back to your OS username. You can change it in your config later if desired.\n"
    );
  }
  const iamUser = identityArn ? identityArn.split("/")[1] : undefined;
  return iamUser ?? os.userInfo().username;
}

export const stackFilter = (config: Config) =>
  config.env ? `*/${config.env.replace("{user}", config.user)}/*` : "";

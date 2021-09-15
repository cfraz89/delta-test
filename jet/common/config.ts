export interface Config {
  user: string;
  env?: string;
  outDir: string;
  fly: {
    watcher: {
      watch: string[];
      ignore: string[];
    };
    synthArgs: string[];
    deployArgs: string[];
  };
}

export const DefaultConfig: Config = {
  user: "user",
  env: "dev-{user}",
  outDir: ".jet",
  fly: {
    watcher: {
      watch: ["lib/**/*.ts", "lib/**/*.js"],
      ignore: ["node_modules"],
    },
    synthArgs: ["-q"],
    deployArgs: [],
  },
};

export const DefaultConfigPath = ".jetrc.json5";

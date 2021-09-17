export interface Config {
  user: string;
  outDir: string;
  dev: {
    stage: string;
    watcher: {
      watch: string[];
      ignore: string[];
    };
    synthArgs: string[];
    deployArgs: string[];
  };
}

export const DefaultDevStage = "dev-{user}";

export const DefaultConfig: Config = {
  user: "user",
  outDir: ".jet",
  dev: {
    stage: DefaultDevStage,
    watcher: {
      watch: ["lib/**/*.ts", "lib/**/*.js"],
      ignore: ["node_modules"],
    },
    synthArgs: ["-q"],
    deployArgs: [],
  },
};

export const DefaultConfigPath = ".jetrc.json5";

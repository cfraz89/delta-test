export interface Config {
  user: string;
  env?: string;
  outDir: string;
  fly: {
    watcher: {
      lambda: {
        watch: string[];
        ignore: string[];
      };
      deploy: {
        watch: string[];
        ignore: string[];
      };
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
      lambda: {
        watch: [
          "lib/lambda/**/*.ts",
          "lib/lambda/**/*.js",
          "lambda/**/*.ts",
          "lambda/**/*.js",
        ],
        ignore: ["node_modules"],
      },
      deploy: {
        watch: ["lib/**/*.ts", "lib/**/*.js"],
        ignore: ["node_modules", "lambda"],
      },
    },
    synthArgs: ["-q"],
    deployArgs: [],
  },
};

export const DefaultConfigPath = ".jetrc.json5";

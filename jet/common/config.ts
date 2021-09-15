export interface Config {
  user: string;
  env?: string;
  outDir: string;
  watch: string | string[];
  ignore: string | string[];
  synth: string[];
  deploy: string[];
}

export const DefaultConfig: Config = {
  user: "user",
  env: "dev-{user}",
  outDir: ".jet",
  watch: "lib/**/*.ts",
  ignore: "node_modules",
  synth: ["-q"],
  deploy: [],
};

export const DefaultConfigPath = ".jetrc.json5";

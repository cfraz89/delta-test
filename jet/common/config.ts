export interface Config {
  user: string;
  env: string;
  outDir: string;
  watch: string | string[];
  ignore: string | string[];
  synth: string[];
  deploy: string[];
}

export const Defaults: Config = {
  user: "user",
  env: "#personal",
  outDir: ".jet",
  watch: "lib/**/*.ts",
  ignore: "node_modules",
  synth: ["-q"],
  deploy: [],
};

export const DefaultConfigPath = ".jetrc.json5";

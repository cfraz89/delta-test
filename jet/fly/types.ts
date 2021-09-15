export interface Stack {
  jet: string;
}

export interface JetOutput {
  functions: Function[];
  assemblyOutDir: string;
}

export interface Function {
  id: string;
  name: string;
  path: string;
}

import { Construct, Stage, StageProps } from "@aws-cdk/core";
import { DefaultConfig } from "../common/config";
import { getConfig } from "./config";

export interface JetEnvsProps {
  envs?: string[];
  stacks: (scope: Construct) => void;
}

export const DefaultEnv = DefaultConfig.env!;

export class JetEnvs extends Construct {
  constructor(scope: Construct, id: string, props: JetEnvsProps) {
    super(scope, id);
    const configFile = scope.node.tryGetContext("jet-config");
    const config = getConfig(configFile);
    (props.envs ?? [DefaultEnv]).forEach((env) => {
      new JetStage(this, env.replace("{user}", config.user), props.stacks);
    });
  }
}

class JetStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    stacks: (scope: Construct) => void,
    props?: StageProps
  ) {
    super(scope, id, props);
    this.node.setContext("jet-assembly-out-dir", this._assemblyBuilder.outdir);
    stacks(this);
  }
}

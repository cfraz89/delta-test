import {
  Aspects,
  Construct,
  IAspect,
  IConstruct,
  Stack,
  Stage,
  StageProps,
} from "@aws-cdk/core";
import { DefaultConfig } from "../common/config";
import { getConfig } from "./config";
import { jetOutput } from "./stack";

export interface JetHangarProps {
  envs?: string[];
  stacks: (scope: Construct) => void;
}

export const DefaultEnv = DefaultConfig.env!;

export class JetHangar extends Construct {
  constructor(scope: Construct, id: string, props: JetHangarProps) {
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
    Aspects.of(this).add(new StackJetter());
  }
}

class StackJetter implements IAspect {
  public visit(node: IConstruct): void {
    // See that we're dealing with a CfnBucket
    if (node instanceof Stack) {
      jetOutput(node);
    }
  }
}

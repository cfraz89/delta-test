import {
  CfnElement,
  CfnOutput,
  CfnResource,
  Construct,
  Stack,
  StackProps,
  Stage,
  StageProps,
} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { getConfig } from "./config";
import { Defaults } from "../common/config";

export function jetEnv(scope: Construct, id: string) {
  const configFile = scope.node.tryGetContext("jet-config");
  const config = getConfig(configFile);
  const env: string = scope.node.tryGetContext("jet-env") ?? Defaults.env;
  const envName = env
    .replace("{personal}", `personal-${config.user}`)
    .replace("{user}", config.user);
  return `${envName}-${id}`;
}
export function jetOutput(scope: Construct) {
  if (scope.node.tryGetContext("jet")) {
    const fns = scope.node
      .findAll()
      .map((c) => {
        let f = c as lambda.Function;
        return f.functionArn
          ? {
              id: f.node.id,
              name: f.functionName,
              path: (f.node.defaultChild as CfnResource).getMetadata(
                "aws:asset:path"
              ),
            }
          : undefined;
      })
      .filter((x) => x);

    new CfnOutput(scope, "jetfns", {
      value: JSON.stringify(fns),
    });
  }
}

export class JetStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    stacks: (scope: Construct) => void,
    props?: StageProps
  ) {
    super(scope, jetEnv(scope, id), props);
    stacks(this);
    jetOutput(this);
  }
}

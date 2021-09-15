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

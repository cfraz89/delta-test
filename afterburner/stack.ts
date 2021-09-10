import { CfnElement, CfnOutput, CfnResource, Construct } from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";

export function afterburner(scope: Construct) {
  if (scope.node.tryGetContext("afterburner")) {
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

    new CfnOutput(scope, "fns", {
      value: JSON.stringify(fns),
    });
  }
}

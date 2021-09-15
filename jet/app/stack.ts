import { CfnElement, CfnOutput, CfnResource, Construct } from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";

export function jetOutput(scope: Construct) {
  if (scope.node.tryGetContext("jet")) {
    const functions = scope.node
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

    new CfnOutput(scope, "jet", {
      value: JSON.stringify({
        functions,
        assemblyOutDir: scope.node.tryGetContext("jet-assembly-out-dir"),
      }),
    });
  }
}

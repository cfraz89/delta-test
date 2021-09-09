import * as cdk from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import * as lambda from "@aws-cdk/aws-lambda";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import {
  CfnElement,
  CfnOutput,
  CfnResource,
  Fn,
  Resource,
} from "@aws-cdk/core";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
export class CdkTestStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const testFunc = new NodejsFunction(this, "MyFunction", {
      entry: "lib/lambda-test.ts",
    });
    // const testFunc2 = new NodejsFunction(this, "MyFunction2", {
    //   entry: "lib/lambda-test.ts",
    // });
    const api = new HttpApi(this, "myapi", {});
    api.addRoutes({
      path: "/test",
      integration: new LambdaProxyIntegration({
        handler: testFunc,
      }),
    });
    new CfnOutput(this, "api", { value: api.apiEndpoint });
    const fns = this.node
      .findAll()
      .map((c) => {
        let f = c as lambda.Function;
        return f.functionArn
          ? {
              name: f.functionName,
              logicalId: (f.node.defaultChild as CfnElement).logicalId,
              arn: f.functionArn,
            }
          : undefined;
      })
      .filter((x) => x);

    new CfnOutput(this, "fns", { value: JSON.stringify(fns) });
  }
}

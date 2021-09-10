import * as cdk from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { CfnCondition, CfnElement, CfnOutput, Fn } from "@aws-cdk/core";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
import { afterburner } from "../afterburner/stack";
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
    afterburner(this);
  }
}

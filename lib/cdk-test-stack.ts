import * as cdk from "@aws-cdk/core";
import { CfnOutput, Fn } from "@aws-cdk/core";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { jetOutput, jetEnv } from "../jet/app/stack";
import { route } from "../afterburner/HttpApi";
export class CdkTestStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new HttpApi(this, "myapi", {});
    const routes = route(api, {
      "/test": "lib/lambda-test.ts",
    });
    new CfnOutput(this, "api", { value: api.apiEndpoint });
  }
}

import * as cdk from "@aws-cdk/core";
import { CfnOutput } from "@aws-cdk/core";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
import { route } from "../afterburner-cdk/HttpApi";
export class CdkTestStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new HttpApi(this, "myapi", {});
    route(api, {
      "/test": { GET: "lib/lambda-test.ts" },
    });
    new CfnOutput(this, "api", { value: api.apiEndpoint });
  }
}

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkTestStack } from "../lib/cdk-test-stack";
import { resolveEnv } from "../afterburner/env";

const app = new cdk.App();

resolveEnv().then((env) => {
  new CdkTestStack(app, env("CdkTestStack"));
});

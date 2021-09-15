#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkTestStack } from "../lib/cdk-test-stack";
import { DefaultEnv, JetEnvs } from "../jet/app/envs";

const app = new cdk.App();
new JetEnvs(app, "Test", {
  envs: [DefaultEnv, "uat"],
  stacks: (stage) => {
    new CdkTestStack(stage, "CdkTestStack");
  },
});

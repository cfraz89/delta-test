#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkTestStack } from "../lib/cdk-test-stack";
import { DefaultEnv, JetHangar } from "../jet/app/hangar";

const app = new cdk.App();
new JetHangar(app, "CdkTest", {
  envs: [DefaultEnv, "uat"],
  stacks: (stage) => {
    new CdkTestStack(stage, "CdkTestStack");
  },
});

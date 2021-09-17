#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkTestStack } from "../lib/cdk-test-stack";
import { JetHangar } from "../@jet-cdk/lib/hangar";

const app = new cdk.App();
new JetHangar(app, "CdkTest", {
  "dev-{user}": (stage) => {
    new CdkTestStack(stage, "CdkTestStack");
  },
  production: (stage) => {
    new CdkTestStack(stage, "CdkTestStack");
  },
});

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkTestStack } from "../lib/cdk-test-stack";
import { JetStage } from "../jet/app/stack";

const app = new cdk.App();
// new JetStage(app, "MyStage", (stage) => {
new CdkTestStack(app, "CdkTestStack");
// });

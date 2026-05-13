#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MaiDongXiStack } from "../lib/mai-dong-xi-stack";

const app = new cdk.App();
new MaiDongXiStack(app, "MaiDongXiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "mai-dong-xi — shared household shopping list (Lambda + DynamoDB + Translate)",
});

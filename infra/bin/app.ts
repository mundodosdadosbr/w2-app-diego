#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { W2Stack } from "../lib/w2-stack";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION ?? "us-east-1";
// Email que recebe alertas de budget. Exporta antes de cdk deploy:
//   export W2_ALERT_EMAIL=voce@exemplo.com
const alertEmail = process.env.W2_ALERT_EMAIL;
const monthlyBudgetUsd = Number(process.env.W2_BUDGET_USD ?? "15");

new W2Stack(app, "W2StackProd", {
  env: { account, region },
  stage: "prod",
  alertEmail,
  monthlyBudgetUsd,
  description:
    "W2 App — infra AWS: S3 buckets (STT + recordings) + IAM user + Budget alert.",
});

new W2Stack(app, "W2StackDev", {
  env: { account, region },
  stage: "dev",
  alertEmail,
  monthlyBudgetUsd,
  description: "W2 App — stack de desenvolvimento.",
});

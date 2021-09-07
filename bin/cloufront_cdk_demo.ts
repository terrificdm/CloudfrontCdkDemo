#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CloudfrontCdkStack } from '../lib/cloudfront_cdk-stack';
import { InfraCdkStack } from '../lib/infra_cdk-stack';

const app = new cdk.App();
new InfraCdkStack(app, 'InfraCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

new CloudfrontCdkStack(app, 'CloudfrontCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

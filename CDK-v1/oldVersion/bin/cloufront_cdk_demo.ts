#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CloudfrontCdkStack } from '../lib/cloudfront_cdk-stack';
import { InfraCdkStack } from '../lib/infra_cdk-stack';

const app = new cdk.App();
const infraStack = new InfraCdkStack(app, 'InfraCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

new CloudfrontCdkStack(app, 'CloudfrontCdkStack', {
  s3Origin: infraStack.s3Bucket, 
  httpOrigin: infraStack.ec2Instance.instancePublicDnsName, // Use properties of InfraCdkStack as parameters(props) of CloudfrontCdkStack
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

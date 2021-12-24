import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from '@aws-cdk/pipelines';
import { PipelineStage } from './pipeline-stage';

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const repo = new codecommit.Repository(this, 'CloudFrontCDKRepo', {
      repositoryName: "CloudFrontCDKRepo"
    });
    
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'CloudfrontPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.codeCommit(repo, 'master'),
        commands: ['export NPM_CONFIG_UNSAFE_PERM=true', 'npm ci', 'npm run build', 'npx cdk synth ']
      })
    });
    
     const staging = new PipelineStage(this, 'Staging', {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
      stage: 'Staging' // Parameter to pass to PipelineStage then for CloudfrontCdkStack to define policies
    });
    const deployStaging = pipeline.addStage(staging);
    
    deployStaging.addPost(new ShellStep('Validate',{
      envFromCfnOutputs: {appUrl:staging.serviceUrl},
      commands: ['curl -Ssf https://$appUrl']
    }))
    
    const prod = new PipelineStage(this, 'Prod', {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
      stage: 'Prod' // Parameter to pass to PipelineStage then for CloudfrontCdkStack to define policies
    });
    const deployProd = pipeline.addStage(prod);
    
     deployProd.addPre(new ManualApprovalStep('ReviewApproval'));

  }
}

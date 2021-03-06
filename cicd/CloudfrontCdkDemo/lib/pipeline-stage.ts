import * as cdk from 'aws-cdk-lib';
import { CloudfrontCdkStack } from './cloudfront_cdk-stack';
import { Construct } from 'constructs';

export interface PipelineStageProps extends cdk.StageProps {
  stage: string
}; //Define a parameter(prop) to pass to CloudfrontCdkStack


export class PipelineStage extends cdk.Stage {
    public readonly serviceUrl: cdk.CfnOutput;
    
    constructor(scope: Construct, id: string, props: PipelineStageProps) {
      super(scope, id, props);
  
      const CFStack = new CloudfrontCdkStack(this, 'CFStack',{
        environment: props.stage
      });
      
      this.serviceUrl = CFStack.cfUrl;
    }
}
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ssm from '@aws-cdk/aws-ssm';
// import * as customresource from '@aws-cdk/custom-resources'

export class InfraCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* Create a S3 bucket to hold flask static content */
    const staticBucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  
    new s3deploy.BucketDeployment(this, 'StaticAssets', {
      sources: [s3deploy.Source.asset('./flask-demo/static')],
      destinationBucket: staticBucket,
      destinationKeyPrefix: 'static'
    }); // Upload static content to S3 bucket for Flask website
    
    const appAssets = new assets.Asset(this, 'AppAssets', {
      path: './flask-demo/app'
    }); // Upload Flask app files as a zip file to assets bucket for EC2 to download and run

    new cdk.CfnOutput(this, 'BucketConsole', {
      value: 'https://console.aws.amazon.com/s3/buckets/'+staticBucket.bucketName,
      description: 'The AWS console for specific S3 bucket'
    });
    new cdk.CfnOutput(this, 'BucketName', {
      value: staticBucket.bucketName,
      description: 'The S3 bucket for storing static content of flask app'
    });
    
    /* Create an EC2 to run flask app which generates the dynamic content */ 
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {isDefault: true,});
    
    const amznLinux = ec2.MachineImage.latestAmazonLinux({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
    });
    
    const appInstance = new ec2.Instance(this, 'Instance',{
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amznLinux,
      keyName:'demo' // You need to modify the value of keyName with your own key-pairs name!
    });
    
    appAssets.grantRead(appInstance.role);
    appInstance.userData.addS3DownloadCommand({
      bucket: appAssets.bucket,
      bucketKey: appAssets.s3ObjectKey,
      localFile: '/tmp/app.zip'
    });
    appInstance.userData.addCommands('cd /tmp && unzip app.zip && chmod +x start.sh && ./start.sh');
    
    appInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(22), 'Allow ssh from internet');
    appInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(80), 'Allow http from internet');
    
    new cdk.CfnOutput(this, 'InstanceConsole', {
      value: 'https://console.aws.amazon.com/ec2/home?region='+appInstance.env.region+'#Instances:search='+appInstance.instanceId,
      description: 'The AWS console for specific EC2 instance'
    });
    new cdk.CfnOutput(this, 'InstancePublicDNSName', {
      value: appInstance.instancePublicDnsName,
      description: 'The EC2 for running flask app which generates dynamic content'
    });
    
    /* Store S3 bucket arn and EC2 public domain name in the SSM Parameter Store */ 
    new ssm.StringParameter(this, 'BuckerName', {
      description: 'S3 Bucket Name',
      parameterName: 's3BucketName',
      stringValue: staticBucket.bucketName
    });
    new ssm.StringParameter(this, 'EC2PublicDomainName', {
      description: 'EC2 Public Domain Name',
      parameterName: 'ec2PublicDnsName',
      stringValue: appInstance.instancePublicDnsName
    });
    
    // /* Store S3 bucket arn and EC2 public domain name in the SSM Parameter Store, only needed when CloudfrontStack is not within the same region with InfraStack */ 
    // if (process.env.region === 'us-east-1') {
    //   new ssm.StringParameter(this, 'BuckerName', {
    //     description: 'S3 Bucket Name',
    //     parameterName: 's3BucketName',
    //     stringValue: staticBucket.bucketName
    //   });
    //   new ssm.StringParameter(this, 'EC2PublicDomainName', {
    //     description: 'EC2 Public Domain Name',
    //     parameterName: 'ec2PublicDnsName',
    //     stringValue: appInstance.instancePublicDnsName
    //   });
    // } else {
    //   new customresource.AwsCustomResource(this, 'BuckerName', {
    //     onUpdate:{
    //       service: 'SSM',
    //       action: 'putParameter',
    //       parameters: {Name: 's3BucketName', Value: staticBucket.bucketName, Description: 'S3 Bucket Name', Type: 'String', Overwrite: true},
    //       region: 'us-east-1',
    //       physicalResourceId: customresource.PhysicalResourceId.of(Date.now().toString())
    //     },
    //     policy: customresource.AwsCustomResourcePolicy.fromSdkCalls({resources: customresource.AwsCustomResourcePolicy.ANY_RESOURCE})
    //   });
    //   new customresource.AwsCustomResource(this, 'EC2PublicDomainName', {
    //     onUpdate:{
    //       service: 'SSM',
    //       action: 'putParameter',
    //       parameters: {Name: 'ec2PublicDnsName', Value: appInstance.instancePublicDnsName, Description: 'EC2 Public Domain Name', Type: 'String', Overwrite: true},
    //       region: 'us-east-1',
    //       physicalResourceId: customresource.PhysicalResourceId.of(Date.now().toString())
    //     },
    //     policy: customresource.AwsCustomResourcePolicy.fromSdkCalls({resources: customresource.AwsCustomResourcePolicy.ANY_RESOURCE})
    //   });
    // }
  }
}

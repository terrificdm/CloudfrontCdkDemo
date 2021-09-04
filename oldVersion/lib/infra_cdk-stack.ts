import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as ec2 from '@aws-cdk/aws-ec2';

export class InfraCdkStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly ec2Instance: ec2.Instance; // Expose properties of InfraCdkStack
  
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* Create a S3 bucket to hold Flask website static content */
    this.s3Bucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // S3 bucket auto-deletion when using "cdk destroy" command
      autoDeleteObjects: true
    });
    const staticBucket = this.s3Bucket;
    
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
    
    this.ec2Instance = new ec2.Instance(this, 'Instance',{
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amznLinux,
      keyName:'demo' // You need to modify the value of keyName with your own key-pairs name!
    });
    const appInstance = this.ec2Instance;
    
    appAssets.grantRead(appInstance.role);
    appInstance.userData.addS3DownloadCommand({
      bucket: appAssets.bucket,
      bucketKey: appAssets.s3ObjectKey,
      localFile: '/tmp/app.zip'
    });
    appInstance.userData.addCommands('cd /tmp && unzip -o app.zip && chmod +x start.sh && ./start.sh && rm /var/lib/cloud/instance/sem/config_scripts_user');
    
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
  }
}

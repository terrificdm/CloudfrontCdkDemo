import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ssm from '@aws-cdk/aws-ssm';
import * as iam from '@aws-cdk/aws-iam';

export class CloudfrontCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    /* Import the existing S3 bucket as CloudFront's S3 origin*/
    const s3BucketName = ssm.StringParameter.fromStringParameterName(this, 'BuckerName', 's3BucketName').stringValue;
    const s3Origin = s3.Bucket.fromBucketName(this, 'ImportBucket', s3BucketName);
    
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI'); // Create an OAI for CloudFront to use
    
    const policyStatement = new iam.PolicyStatement({
      actions:    [ 's3:GetObject' ],
      resources:  [ s3Origin.arnForObjects("*") ],
      principals: [ oai.grantPrincipal ],
    }); // S3 bucket policy for granting OAI to access S3 objects 
    
    new s3.BucketPolicy(this, 'cloudfrontAccessBucketPolicy', {
      bucket: s3Origin,
    }).document.addStatements(policyStatement); // Add OAI granted bucket policy to S3 (It will override the existing bucket policy if had) 
    
    const httpOrigin = ssm.StringParameter.fromStringParameterName(this, 'EC2PublicDomainName', 'ec2PublicDnsName').stringValue; // Import EC2 public Domain Name as CloudFront's Http Origin
    
    /* Example 1: Create a stand CF distribution with 2 behaviors which use above EC2 and S3 as origins */
    const distribution = new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(httpOrigin,{
          protocolPolicy:cloudfront.OriginProtocolPolicy.HTTP_ONLY
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED
      },
      additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(s3Origin, {originAccessIdentity: oai}),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
        }
      }
    });
    
    /* Example 2: Basing on Example 1, create a L@E function and a CF distribution, then associate the L@E function to a specific behavior of CF distribution */
    const customCachePolicy = new cloudfront.CachePolicy(this, 'customCachePolicy', {
      cachePolicyName: 'customCachePolicy-Lambda',
      comment: 'Lambda will modify the TTL via "cache-control" header',
      defaultTtl: cdk.Duration.seconds(0), 
      minTtl: cdk.Duration.seconds(0),
      maxTtl:cdk.Duration.seconds(3600),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('CloudFront-Viewer-Country')
    }); // Create a custom cache policy reserved for L@E
    
    const customOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'customOriginRequestPolicy', {
      originRequestPolicyName: 'customOriginRequestPolicy-Lambda',
      comment: 'Pass the "CloudFront-Viewer-Country" header to origin',
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList('CloudFront-Viewer-Country')
    }); // Create a custom origin request policy reserved for L@E
    
    // Create a iam role for L@E
    const edge_role = new iam.Role(this, 'EdgeRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      )
    });
    edge_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')); 
    
    const lambdaFunc = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./functions/lambda'),
      role: edge_role
    });
    
    const dist = distribution.node.defaultChild as cloudfront.CfnDistribution;
    dist.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.CachePolicyId', customCachePolicy.cachePolicyId);
    dist.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId', customOriginRequestPolicy.originRequestPolicyId);
    dist.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations', [
      {
        EventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
        LambdaFunctionARN: lambdaFunc.currentVersion.edgeArn
      }
    ]);
    
    /* Example 3: Basing on Example 2, create a CF function and associate it to a specific behavior of CF distribution */
    const cfFunc = new cloudfront.Function(this, 'CFFunction', {
      code: cloudfront.FunctionCode.fromFile({filePath: './functions/cffunc/cffunc.js'})
    })
    
    dist.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.FunctionAssociations', [
      {
        EventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        FunctionARN: cfFunc.functionArn
      }
    ]);
    
    new cdk.CfnOutput(this, 'CFDistributionConsole', {
      value: 'https://console.aws.amazon.com/cloudfront/v3/home?#/distributions/'+distribution.distributionId,
      description: 'The AWS console for specific CloudFront distribution'
    });
    new cdk.CfnOutput(this, 'CFDistributionDNSName', {
      value: distribution.domainName,
      description: 'The CloudFront distribution for flask app'
    });
  }
}

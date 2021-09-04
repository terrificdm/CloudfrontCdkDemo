import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as lambda from '@aws-cdk/aws-lambda';

export interface CloufrontCdkStackProps extends cdk.StackProps {
  s3Origin: s3.IBucket
  httpOrigin: string
}; //Declare parameters(props) of CloufrontCdkStack

export class CloudfrontCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CloufrontCdkStackProps) {
    super(scope, id, props);
    
    /* Example 1: Creat a stand CF distribution with 2 behaviors which use above EC2 and S3 as origins */
    // const distribution = new cloudfront.Distribution(this, 'myDist', {
    //   defaultBehavior: {
    //     origin: new origins.HttpOrigin(props.httpOrigin, {
    //       protocolPolicy:cloudfront.OriginProtocolPolicy.HTTP_ONLY
    //     }),
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED
    //   },
    //   additionalBehaviors: {
    //     '/static/*': {
    //       origin: new origins.S3Origin(props.s3Origin),
    //       viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //       cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
    //     }
    //   }
    // });
    
    /* Example 2: Create a L@E function and a CF distribution, then associate the L@E function to a specific behavior of CF distribution */
    // const customCachePolicy = new cloudfront.CachePolicy(this, 'customCachePolicy', {
    //   cachePolicyName: 'customCachePolicy-Lambda',
    //   comment: 'Lambda will modify the TTL via "cache-control" header',
    //   defaultTtl: cdk.Duration.seconds(0), 
    //   minTtl: cdk.Duration.seconds(0),
    //   maxTtl:cdk.Duration.seconds(3600),
    //   enableAcceptEncodingBrotli: true,
    //   enableAcceptEncodingGzip: true,
    //   headerBehavior: cloudfront.CacheHeaderBehavior.allowList('CloudFront-Viewer-Country')
    // }); // Create a custom cache policy reserved for L@E
    
    // const customOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'customOriginRequestPolicy', {
    //   originRequestPolicyName: 'customOriginRequestPolicy-Lambda',
    //   comment: 'Pass the "CloudFront-Viewer-Country" header to origin',
    //   headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList('CloudFront-Viewer-Country')
    // }); // Create a custom origin request policy reserved for L@E
    
    // const lambdaFunc = new lambda.Function(this, 'LambdaFunction', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset('./functions/lambda')
    // });
    
    // const distribution = new cloudfront.Distribution(this, 'myDist', {
    //   defaultBehavior: {
    //     origin: new origins.HttpOrigin(props.httpOrigin, {
    //       protocolPolicy:cloudfront.OriginProtocolPolicy.HTTP_ONLY
    //     }),
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     cachePolicy: customCachePolicy,
    //     originRequestPolicy: customOriginRequestPolicy,
    //     edgeLambdas: [{
    //       functionVersion: lambdaFunc.currentVersion,
    //       eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
    //     }]
    //   },
    //   additionalBehaviors: {
    //     '/static/*': {
    //       origin: new origins.S3Origin(props.s3Origin),
    //       viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //       cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
    //     }
    //   }
    // });
    
    /* Example 3: Create a CF function, L@E function and a CF distribution, then associate them to a specific behavior of CF distribution */
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
    
    const cfFunc = new cloudfront.Function(this, 'CFFunction', {
      code: cloudfront.FunctionCode.fromFile({filePath: './functions/cffunc/cffunc.js'})
    })
    
    const lambdaFunc = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./functions/lambda')
    });
    
    const distribution = new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(props.httpOrigin,{
          protocolPolicy:cloudfront.OriginProtocolPolicy.HTTP_ONLY
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: customCachePolicy,
        originRequestPolicy: customOriginRequestPolicy,
        edgeLambdas: [{
          functionVersion: lambdaFunc.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
        }],
        functionAssociations:[{
          function: cfFunc,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
        }]
      },
      additionalBehaviors: {
        '/static/*': {
          origin: new origins.S3Origin(props.s3Origin),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
        }
      }
    });
    
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

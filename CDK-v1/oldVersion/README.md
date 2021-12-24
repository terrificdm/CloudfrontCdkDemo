# CloudFront CDK Deployment

* Similar to this [repo](https://github.com/terrificdm/cloudfrontCDK), just decoupled the single Application(Infra)+CloudFront stack into two seperated stacks: Application(Infra) stack and CloudFront stack.  
* From CloudfrontCdkStack to access resources for S3 bucketName and EC2PublicDomainName of InfraCdkStack(leverage custom interface and props)

# CloudFront CDK Deployment

* Similar to this [repo](https://github.com/terrificdm/cloudfrontCDK), just decoupl the single Application(Infra)+CloudFront stack into two seperated stacks: Application(Infra) stack and CloudFront stack.  
* Use SSM Parameter Store to store and import S3 bucketName and EC2PublicDomainName which are generated by InfraCdkStack for CloudfrontCdkStack.  
* Add CDK Pipeline for continuous delivery use case. 

# Build
* Make sure you follow the [AWS CDK Prerequisites](https://docs.aws.amazon.com/cdk/latest/guide/work-with.html#work-with-prerequisites) before you build the project.
* Clone this project and change the directory to the root folder of the project, and run below commands:
```bash
$ npm install -g aws-cdk
$ npm install  
$ cdk bootstrap
```

# Deploy  
* Run commands as below:
```bash
$ cdk deploy InfraCdkStack  
$ cdk deploy CloudfrontCdkStack
```

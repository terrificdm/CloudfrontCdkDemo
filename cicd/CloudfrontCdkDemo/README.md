# CDK Pipeline deployment use case  

* Continuous delivery for CloudFront resource only  

# Build
* Make sure you follow the [AWS CDK Prerequisites](https://docs.aws.amazon.com/cdk/latest/guide/work-with.html#work-with-prerequisites) before you build the project    
* Clone this project and change the directory to the directory “CloudfrontCdkDemo/cicd/CloudfrontCdkDemo”, and run below commands:  
```bash
$ npm install -g aws-cdk
$ npm install  
$ export CDK_NEW_BOOTSTRAP=1 
$ cdk bootstrap
$ cdk deploy InfraCdkStack
```  
* Once InfraCdkStack finishes deployment, run below command:  
```bash
$ cdk deploy PipelineStack
```   
* After deployment, go back to the root folder where you just cloned the project, and clone the CodeCommit repo which was deployed by PipelineStack to your local system(you need to connect your local system with CodeCommit repo first,  see this [doc.](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-gc.html) to configure the connection between local repo and CodeCommit:  
```bash
$ git clone https://git-codecommit.<your region>.amazonaws.com/v1/repos/CloudFrontCDKRepo
```   
* Copy all files under the directory “CloudfrontCdkDemo/cicd/CloudfrontCdkDemo” to the folder” CloudFrontCDKRepo” which you just cloned from CodeCommit, run below command:  
```bash
$ cp -r CloudfrontCdkDemo/cicd/CloudfrontCdkDemo/. CloudFrontCDKRepo/
```  
# Deploy  
* Change the directory to “CloudFrontCDKRepo” and type below commands to make your pipeline functional   
```bash
git add -A
git commit -m "initial commit"
git push
```  

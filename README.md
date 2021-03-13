- Followed https://docs.aws.amazon.com/cdk/latest/guide/codepipeline_example.html but changed to Github
- https://docs.aws.amazon.com/cdk/latest/guide/cdk_pipeline.html helped to troubleshoot issues
- From local cammand prompt you deploy `cdk deploy PipelineDeployingLambdaStack` and push all the changes to github. First CodePipeline is created, then it pulls code from github and deploys Lambda stack.
- Lambda function is written in Typescript, it builds to javascript and deploys through pipeline.


# Welcome to your CDK TypeScript project!!!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

import * as cdk from '@aws-cdk/core';
import  * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { StringParameter } from '@aws-cdk/aws-ssm';
import { ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as lambda from '@aws-cdk/aws-lambda';

export interface PipelineStackProps extends StackProps {
  readonly lambdaCode: lambda.CfnParametersCode;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: PipelineStackProps) {
    super(scope, id, props);

 
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
  
    const githubOwner = StringParameter.fromStringParameterAttributes(this, 'gitOwner',{
      parameterName: 'github-owner'
    }).stringValue;
  
    const githubRepo = StringParameter.fromStringParameterAttributes(this, 'gitRepo',{
      parameterName: 'cdk-pipeline-git-repo'
    }).stringValue;
  
    const githubBranch = StringParameter.fromStringParameterAttributes(this, 'gitBranch',{
      parameterName: 'cdk-pipeline-git-branch'
    }).stringValue;
    
    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              'npm run build',
              'npm run cdk synth -- -o dist'
            ],
          },
        },
        artifacts: {
          'base-directory': 'dist',
          files: [
            'LambdaStack.template.json',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const lambdaBuild = new codebuild.PipelineProject(this, 'LambdaBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'cd lambda',
              'npm install',
            ],
          },
          build: {
            commands: 'npm run build',
          },
        },
        artifacts: {
          'base-directory': 'lambda',
          files: [
            'index.js',
            'node_modules/**/*',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');
    const lambdaBuildOutput = new codepipeline.Artifact('LambdaBuildOutput');

    const pipeline = new codepipeline.Pipeline(this, 'MyFirstPipeline', {
      pipelineName: 'MyPipeline',
    });

    const sourceStage = pipeline.addStage({
      stageName: 'Source',
      actions: [ // optional property
        // see below...
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub',
          output: sourceOutput,
          //As mentioned in trouble shooting tips, Pipeline: Internal Failure is due to not valid token
          //Add Secret to Secret through UI (for some reason secret added through CLI doesnt work)
          //Check for valid token value by CLI
          //aws secretsmanager get-secret-value --secret-id NewFullAccessToken
          //https://docs.aws.amazon.com/cdk/latest/guide/cdk_pipeline.html
          oauthToken: SecretValue.secretsManager('NewFullAccessToken', {jsonField: 'NewFullAccessToken'}), // this token is stored in Secret Manager
          owner: githubOwner,
          repo: githubRepo,
          branch: githubBranch
        }),
      ],
    });

    const buildStage = pipeline.addStage({
      stageName: 'Build',
      actions: [ // optional property
        // see below...
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Lambda_Build',
          project: lambdaBuild,
          input: sourceOutput,
          outputs: [lambdaBuildOutput],
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CDK_Build',
          project: cdkBuild,
          input: sourceOutput,
          outputs: [cdkBuildOutput],
        }),
      ],
    });

    const deplyStage = pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Lambda_CFN_Deploy',
          templatePath: cdkBuildOutput.atPath('LambdaStack.template.json'),
          stackName: 'LambdaDeploymentStack',
          adminPermissions: true,
          parameterOverrides: {
            ...props?.lambdaCode.assign(lambdaBuildOutput.s3Location)
          },
          extraInputs: [lambdaBuildOutput],
        }),
      ],
    });

    

    

  }
}
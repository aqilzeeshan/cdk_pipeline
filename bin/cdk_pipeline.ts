#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/cdk_pipeline-stack';
import {LambdaStack} from '../lib/lambda-stack';

const app = new cdk.App();

const lambdaStack = new LambdaStack(app, 'LambdaStack');
new PipelineStack(app, 'PipelineDeployingLambdaStack',{
    lambdaCode: lambdaStack.lambdaCode,
});

app.synth();

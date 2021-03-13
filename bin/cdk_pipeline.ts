#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsdevhourBackendPipelineStack } from '../lib/cdk_pipeline-stack';

const app = new cdk.App();
new AwsdevhourBackendPipelineStack(app, 'CdkPipelineStack');

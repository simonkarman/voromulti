#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VoromultiStack } from '../lib/voromulti-stack';

const app = new cdk.App();
new VoromultiStack(app, 'Voromulti', {});

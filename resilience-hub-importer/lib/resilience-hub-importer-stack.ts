import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as resiliencehub from 'aws-cdk-lib/aws-resiliencehub';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ResilienceHubImporterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const resiliencyPolicyArn = this.node.tryGetContext('resiliencyPolicyArn');
    const sourceStackName = this.node.tryGetContext('sourceStackName');
    const appName = this.node.tryGetContext('appName') || 'MyResilienceApp';

    if (!resiliencyPolicyArn || !sourceStackName) {
      console.warn(
        'Missing context: "resiliencyPolicyArn" or "sourceStackName". Destroy may proceed since these are not critical for resource deletion.'
      ); 
    }

    const arhApp = new resiliencehub.CfnApp(this, 'ResilienceHubApplication', {
      name: appName,
      description: 'Resilience configuration for my application',
      appAssessmentSchedule: 'Daily',
      resiliencyPolicyArn: resiliencyPolicyArn,
      appTemplateBody: '{"Resources":{}}',
      resourceMappings: [],
      tags: {
        Environment: 'Production',
      },
    });

    const customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for AWS Resilience Hub import resource',
      inlinePolicies: {
        ResilienceHubImportPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['resiliencehub:ImportResourcesToDraftAppVersion'],
              resources: [arhApp.attrAppArn],
            }),
            new iam.PolicyStatement({
              actions: ['cloudformation:DescribeStacks'],
              resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/${sourceStackName}/*`],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSResilienceHubAsssessmentExecutionPolicy'),
      ],
    });

    const getStackArn = new cr.AwsCustomResource(this, 'GetStackArn', {
      onCreate: {
        service: 'CloudFormation',
        action: 'describeStacks',
        parameters: { StackName: sourceStackName },
        physicalResourceId: cr.PhysicalResourceId.of(`GetStackArn-${sourceStackName}`),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['cloudformation:DescribeStacks'],
          resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/${sourceStackName}/*`],
        }),
      ]),
      role: customResourceRole,
    });

    const stackArn = getStackArn.getResponseField('Stacks.0.StackId');

    const importResources = new cr.AwsCustomResource(this, 'ImportResources', {
      onCreate: {
        service: 'ResilienceHub',
        action: 'importResourcesToDraftAppVersion',
        parameters: {
          appArn: arhApp.attrAppArn,
          sourceArns: [stackArn],
        },
        physicalResourceId: cr.PhysicalResourceId.of(`ImportResources-${appName}`),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['resiliencehub:ImportResourcesToDraftAppVersion'],
          resources: [arhApp.attrAppArn],
        }),
      ]),
      role: customResourceRole,
    });

    importResources.node.addDependency(arhApp);
    importResources.node.addDependency(getStackArn);

    new cdk.CfnOutput(this, 'ApplicationArn', {
      value: arhApp.attrAppArn,
      description: 'ARN of the created Resilience Hub Application',
    });

    new cdk.CfnOutput(this, 'StackArn', {
      value: stackArn,
      description: 'ARN of the source stack',
    });

    new cdk.CfnOutput(this, 'ImportStatus', {
      value: importResources.getResponseField('status'),
      description: 'Status of the import operation',
    });
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilienceHubImporterStack = void 0;
const cdk = require("aws-cdk-lib");
const resiliencehub = require("aws-cdk-lib/aws-resiliencehub");
const cr = require("aws-cdk-lib/custom-resources");
const iam = require("aws-cdk-lib/aws-iam");
class ResilienceHubImporterStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const resiliencyPolicyArn = this.node.tryGetContext('resiliencyPolicyArn');
        const sourceStackName = this.node.tryGetContext('sourceStackName');
        const appName = this.node.tryGetContext('appName') || 'MyResilienceApp';
        // Create Resilience Hub Application
        const arhApp = new resiliencehub.CfnApp(this, 'ResilienceHubApplication', {
            name: appName,
            description: 'Resilience configuration for my application',
            appAssessmentSchedule: 'Daily',
            resiliencyPolicyArn: resiliencyPolicyArn,
            appTemplateBody: '{"Resources":{}}',
            tags: {
                'ApplicationType': 'CDK',
                'Environment': 'Dev',
            },
        });
        // Custom Resource for importing resources
        const importResources = new cr.AwsCustomResource(this, 'ImportResources', {
            onCreate: {
                service: 'ResilienceHub',
                action: 'importResourcesToAppVersion',
                parameters: {
                    appArn: arhApp.attrAppArn,
                    sourceArns: [sourceStackName],
                },
                physicalResourceId: cr.PhysicalResourceId.of('ImportResources'),
            },
            onUpdate: {
                service: 'ResilienceHub',
                action: 'importResourcesToAppVersion',
                parameters: {
                    appArn: arhApp.attrAppArn,
                    sourceArns: [sourceStackName],
                },
                physicalResourceId: cr.PhysicalResourceId.of('ImportResources'),
            },
            policy: cr.AwsCustomResourcePolicy.fromStatements([
                new iam.PolicyStatement({
                    actions: [
                        'resiliencehub:ImportResourcesToAppVersion',
                        'resiliencehub:DescribeDraftAppVersionResourcesImportStatus',
                        'cloudformation:DescribeStacks',
                    ],
                    resources: ['*'],
                }),
            ]),
        });
        // Ensure the import happens after the app is created
        importResources.node.addDependency(arhApp);
        // Output the ARN of the created Resilience Hub Application
        new cdk.CfnOutput(this, 'ApplicationArn', {
            value: arhApp.attrAppArn,
            description: 'ARN of the created Resilience Hub Application',
        });
    }
}
exports.ResilienceHubImporterStack = ResilienceHubImporterStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaWxpZW5jZS1odWItaW1wb3J0ZXItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNpbGllbmNlLWh1Yi1pbXBvcnRlci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsK0RBQStEO0FBQy9ELG1EQUFtRDtBQUNuRCwyQ0FBMkM7QUFFM0MsTUFBYSwwQkFBMkIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN2RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUMzRSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGlCQUFpQixDQUFDO1FBRXhFLG9DQUFvQztRQUNwQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ3hFLElBQUksRUFBRSxPQUFPO1lBQ2IsV0FBVyxFQUFFLDZDQUE2QztZQUMxRCxxQkFBcUIsRUFBRSxPQUFPO1lBQzlCLG1CQUFtQixFQUFFLG1CQUFtQjtZQUN4QyxlQUFlLEVBQUUsa0JBQWtCO1lBQ25DLElBQUksRUFBRTtnQkFDSixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixhQUFhLEVBQUUsS0FBSzthQUNyQjtTQUNGLENBQUMsQ0FBQztRQUVILDBDQUEwQztRQUMxQyxNQUFNLGVBQWUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDeEUsUUFBUSxFQUFFO2dCQUNSLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixNQUFNLEVBQUUsNkJBQTZCO2dCQUNyQyxVQUFVLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVO29CQUN6QixVQUFVLEVBQUUsQ0FBQyxlQUFlLENBQUM7aUJBQzlCO2dCQUNELGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUM7YUFDaEU7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLE1BQU0sRUFBRSw2QkFBNkI7Z0JBQ3JDLFVBQVUsRUFBRTtvQkFDVixNQUFNLEVBQUUsTUFBTSxDQUFDLFVBQVU7b0JBQ3pCLFVBQVUsRUFBRSxDQUFDLGVBQWUsQ0FBQztpQkFDOUI7Z0JBQ0Qsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQzthQUNoRTtZQUNELE1BQU0sRUFBRSxFQUFFLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7b0JBQ3RCLE9BQU8sRUFBRTt3QkFDUCwyQ0FBMkM7d0JBQzNDLDREQUE0RDt3QkFDNUQsK0JBQStCO3FCQUNoQztvQkFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7aUJBQ2pCLENBQUM7YUFDSCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgscURBQXFEO1FBQ3JELGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTNDLDJEQUEyRDtRQUMzRCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVTtZQUN4QixXQUFXLEVBQUUsK0NBQStDO1NBQzdELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTlERCxnRUE4REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyByZXNpbGllbmNlaHViIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZXNpbGllbmNlaHViJztcbmltcG9ydCAqIGFzIGNyIGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuXG5leHBvcnQgY2xhc3MgUmVzaWxpZW5jZUh1YkltcG9ydGVyU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCByZXNpbGllbmN5UG9saWN5QXJuID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3Jlc2lsaWVuY3lQb2xpY3lBcm4nKTtcbiAgICBjb25zdCBzb3VyY2VTdGFja05hbWUgPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnc291cmNlU3RhY2tOYW1lJyk7XG4gICAgY29uc3QgYXBwTmFtZSA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdhcHBOYW1lJykgfHwgJ015UmVzaWxpZW5jZUFwcCc7XG5cbiAgICAvLyBDcmVhdGUgUmVzaWxpZW5jZSBIdWIgQXBwbGljYXRpb25cbiAgICBjb25zdCBhcmhBcHAgPSBuZXcgcmVzaWxpZW5jZWh1Yi5DZm5BcHAodGhpcywgJ1Jlc2lsaWVuY2VIdWJBcHBsaWNhdGlvbicsIHtcbiAgICAgIG5hbWU6IGFwcE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1Jlc2lsaWVuY2UgY29uZmlndXJhdGlvbiBmb3IgbXkgYXBwbGljYXRpb24nLFxuICAgICAgYXBwQXNzZXNzbWVudFNjaGVkdWxlOiAnRGFpbHknLFxuICAgICAgcmVzaWxpZW5jeVBvbGljeUFybjogcmVzaWxpZW5jeVBvbGljeUFybixcbiAgICAgIGFwcFRlbXBsYXRlQm9keTogJ3tcIlJlc291cmNlc1wiOnt9fScsXG4gICAgICB0YWdzOiB7XG4gICAgICAgICdBcHBsaWNhdGlvblR5cGUnOiAnQ0RLJyxcbiAgICAgICAgJ0Vudmlyb25tZW50JzogJ0RldicsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ3VzdG9tIFJlc291cmNlIGZvciBpbXBvcnRpbmcgcmVzb3VyY2VzXG4gICAgY29uc3QgaW1wb3J0UmVzb3VyY2VzID0gbmV3IGNyLkF3c0N1c3RvbVJlc291cmNlKHRoaXMsICdJbXBvcnRSZXNvdXJjZXMnLCB7XG4gICAgICBvbkNyZWF0ZToge1xuICAgICAgICBzZXJ2aWNlOiAnUmVzaWxpZW5jZUh1YicsXG4gICAgICAgIGFjdGlvbjogJ2ltcG9ydFJlc291cmNlc1RvQXBwVmVyc2lvbicsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBhcHBBcm46IGFyaEFwcC5hdHRyQXBwQXJuLFxuICAgICAgICAgIHNvdXJjZUFybnM6IFtzb3VyY2VTdGFja05hbWVdLFxuICAgICAgICB9LFxuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IGNyLlBoeXNpY2FsUmVzb3VyY2VJZC5vZignSW1wb3J0UmVzb3VyY2VzJyksXG4gICAgICB9LFxuICAgICAgb25VcGRhdGU6IHtcbiAgICAgICAgc2VydmljZTogJ1Jlc2lsaWVuY2VIdWInLFxuICAgICAgICBhY3Rpb246ICdpbXBvcnRSZXNvdXJjZXNUb0FwcFZlcnNpb24nLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgYXBwQXJuOiBhcmhBcHAuYXR0ckFwcEFybixcbiAgICAgICAgICBzb3VyY2VBcm5zOiBbc291cmNlU3RhY2tOYW1lXSxcbiAgICAgICAgfSxcbiAgICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkOiBjci5QaHlzaWNhbFJlc291cmNlSWQub2YoJ0ltcG9ydFJlc291cmNlcycpLFxuICAgICAgfSxcbiAgICAgIHBvbGljeTogY3IuQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuZnJvbVN0YXRlbWVudHMoW1xuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgJ3Jlc2lsaWVuY2VodWI6SW1wb3J0UmVzb3VyY2VzVG9BcHBWZXJzaW9uJyxcbiAgICAgICAgICAgICdyZXNpbGllbmNlaHViOkRlc2NyaWJlRHJhZnRBcHBWZXJzaW9uUmVzb3VyY2VzSW1wb3J0U3RhdHVzJyxcbiAgICAgICAgICAgICdjbG91ZGZvcm1hdGlvbjpEZXNjcmliZVN0YWNrcycsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICB9KSxcbiAgICAgIF0pLFxuICAgIH0pO1xuXG4gICAgLy8gRW5zdXJlIHRoZSBpbXBvcnQgaGFwcGVucyBhZnRlciB0aGUgYXBwIGlzIGNyZWF0ZWRcbiAgICBpbXBvcnRSZXNvdXJjZXMubm9kZS5hZGREZXBlbmRlbmN5KGFyaEFwcCk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIEFSTiBvZiB0aGUgY3JlYXRlZCBSZXNpbGllbmNlIEh1YiBBcHBsaWNhdGlvblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBsaWNhdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiBhcmhBcHAuYXR0ckFwcEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBjcmVhdGVkIFJlc2lsaWVuY2UgSHViIEFwcGxpY2F0aW9uJyxcbiAgICB9KTtcbiAgfVxufSJdfQ==
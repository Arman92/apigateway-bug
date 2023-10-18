import * as cdk from "aws-cdk-lib";
import { ApiDefinition, SpecRestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { readFileSync } from "fs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const specs = JSON.parse(
      readFileSync("assets/api-type-array-error.json", { encoding: "utf-8" })
    );

    const myLambda = new lambda.Function(this, "MyLambdaFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
    });

    // Lambda integration should be added to the specs, can't add the integration with CDK
    const stack = cdk.Stack.of(myLambda);
    specs.paths["/testPost"].post[
      "x-amazon-apigateway-integration"
    ].uri = `arn:${stack.partition}:apigateway:${stack.region}:lambda:path/2015-03-31/functions/${myLambda.functionArn}/invocations`;

    // Define the REST API using SpecRestApi construct
    new SpecRestApi(this, "MyRestApi", {
      apiDefinition: ApiDefinition.fromInline(specs),
    });
  }
}

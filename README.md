# ApiGateway nullable type bug

## Context

API Gateway offers a way to create REST APIs by importing OpenAPI specs, with some [limitations](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html#api-gateway-known-issues-rest-apis).

However API Gateway does not support `nullable` properties, there are two ways of defining a nullable field:

In OpenAPI:

```json
{
  "mySchema": {
    "type": "number",
    "nullable": true
  }
}
```

In JSON Schema:

```json
{
  "mySchema": {
    "type": ["number", "null"]
  }
}
```

However API Gateway does not support either of these when you import the OpenAPI specs with AWS CLI or CDK.

# How to reproduce 
Below I have documented two ways to reproduce this issue, AWC CLI and AWS CDK

## AWS CLI

Using AWS CLI, one should be able to import OpenAPI specs to API Gateway, [source doc](https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html)

importing `api.json` file which has both JSON schema and OpenAPI notations of `nullable` fields, shows API gateway is not correctly handling this.

Running this:

```bash
aws apigateway import-rest-api \
    --region eu-west-1 \
    --body 'fileb://api.json'
```

will create a new API in ApiGateway, however the corresponding model lack the nullable notation.

Source Schema:

```json
"Orders": {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "orderId": { "type": "string" },
      "parentId": { "type": ["string", "null"] },
      "partIdentifier": {
        "anyOf": [{ "type": "string" }, { "type": "null" }]
      },
      "description": { "type": "string", "nullable": true },
      "extras": { "type": ["string", "null"], "nullable": true }
    },
    "required": ["orderId", "partIdentifier", "description"]
  }
}
```

Resulting Model in API Gateway, note that `parentId` and `extras` have become dumb fields, not having any schema definition.
![Alt text](assets/models_screenshot.png?raw=true "Title")

Currently the only way to hack around this, is to make a composite type by using `anyOf`, take a look at `partIdentifier`

## AWS CDK

The same issue is reproducible by using AWS CDK's [SpecRestAPI](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.SpecRestApi.html), take a look inside `cdk` folder.
The Specs are located in [assets/api-type-array-error.json](cdk/assets/api-type-array-error.json).

To deploy the CDK stack to your AWS account:

```bash
cd cdk && cdk deploy
```

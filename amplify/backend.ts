import { defineBackend } from "@aws-amplify/backend";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { apiFunction } from "./functions/api-handler/resource";

const backend = defineBackend({
  apiFunction,
});

const apiStack = backend.createStack("api-stack");

const itemsTable = new dynamodb.Table(apiStack, "ItemsTable", {
  partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.DESTROY,
});

const lambdaResources = backend.apiFunction.resources;
itemsTable.grantReadWriteData(lambdaResources.lambda);
lambdaResources.cfnResources.cfnFunction.environment = {
  variables: {
    TABLE_NAME: itemsTable.tableName,
  },
};

const api = new apigateway.LambdaRestApi(apiStack, "ItemsApi", {
  handler: lambdaResources.lambda,
  proxy: true,
  deployOptions: { stageName: "api" },
});

backend.addOutput({
  custom: {
    API: {
      itemsApi: {
        endpoint: api.url,
        region: Stack.of(api).region,
        apiName: api.restApiName,
      },
    },
  },
});

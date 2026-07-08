import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME as string;

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "POST") {
    const body = event.body ? JSON.parse(event.body) : {};
    const item = { id: randomUUID(), ...body, createdAt: new Date().toISOString() };
    await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    };
  }

  const { Items } = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "hello-world", items: Items ?? [] }),
  };
};

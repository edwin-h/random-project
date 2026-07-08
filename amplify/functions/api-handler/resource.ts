import { defineFunction } from "@aws-amplify/backend";

export const apiFunction = defineFunction({
  name: "api-handler",
  entry: "./handler.ts",
  runtime: 22,
  timeoutSeconds: 10,
});

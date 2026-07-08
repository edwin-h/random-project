# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository holds the AWS backend infrastructure for a planned web +
mobile app (frontend not yet scaffolded — see "Planned frontend" below).
The backend is defined with **AWS Amplify Gen 2**, which generates AWS CDK
under the hood, so any AWS CDK construct can be dropped into `amplify/backend.ts`
alongside Amplify's own constructs.

## Commands

Run from the repo root:

- `npm install` — install backend dependencies.
- `npm run sandbox` (`npx ampx sandbox`) — deploy a personal, isolated
  cloud sandbox for local development/preview; watches `amplify/` and
  hot-deploys on save. Requires AWS credentials configured locally.
- `npm run deploy` (`npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`)
  — the command Amplify Hosting's CI runs on each branch push; not meant
  to be run by hand outside that pipeline.
- `cd amplify && npx tsc --noEmit -p tsconfig.json` — typecheck the backend
  definition. (There is no root-level frontend build/lint/test yet — those
  will be added once a frontend app exists.)

There is no test suite yet.

## Architecture

The backend (`amplify/`) is a minimal, scalable serverless API:

- `amplify/backend.ts` — entry point. Calls `defineBackend()` with the
  Amplify-managed function, then uses raw CDK (`aws-cdk-lib/aws-apigateway`,
  `aws-cdk-lib/aws-dynamodb`) to provision a DynamoDB table and wire it to a
  Lambda-backed REST API. This is the pattern to follow for any further
  infra: define Amplify-native resources (functions, auth, data) via
  `defineBackend`, then reach for CDK escape hatches for anything Amplify
  doesn't model directly (extra tables, queues, custom API Gateway routes,
  etc.), all inside `backend.ts`.
- `amplify/functions/api-handler/` — the one Lambda function so far
  (`resource.ts` declares it via `defineFunction`, `handler.ts` is the
  implementation). Additional functions should follow this same
  `resource.ts` + `handler.ts` pair pattern under `amplify/functions/<name>/`.
- The Lambda reads/writes DynamoDB via the AWS SDK v3 document client
  (`@aws-sdk/lib-dynamodb`), using the `TABLE_NAME` env var that
  `backend.ts` injects — do not hardcode table names in handler code.
- API Gateway is created with `LambdaRestApi` in proxy mode, so all
  routes/methods funnel into the single handler; route dispatch (if needed)
  happens inside `handler.ts` via `event.httpMethod`/`event.path`, not via
  additional API Gateway resources.

This stack scales to zero (pay-per-request DynamoDB, Lambda, no idle
compute) and needs no servers to manage — the intended tradeoff for a
minimal-but-scalable starting point over a container/ALB-based setup.

## Planned frontend

Not yet scaffolded. Direction discussed but not implemented: a React
Native/Expo (with React Native Web) or Flutter client, hosted for web via
AWS Amplify Hosting, calling the API Gateway endpoint provisioned above.
Ask before assuming which of these to scaffold — it hasn't been decided.

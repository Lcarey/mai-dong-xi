# mai-dong-xi — project plan

Shared household shopping list: **no passwords**, **DynamoDB** persistence, **Lambda + Hono** API, **React PWA** on **S3 + CloudFront** (same pattern as `popcorn-quest`). **AWS Translate** fills **English + Simplified Chinese** on every new/edit.

## Goals

- One URL for the whole household; anyone can add, check off, delete, clear done.
- Display language toggle (EN / 简体中文) client-side; data always has both strings.
- Manual sync: pull-to-refresh, refresh button, refetch on tab focus.

## Stack

| Layer | Choice |
|-------|--------|
| Web | React 18, Vite, Tailwind, TanStack Query, vite-plugin-pwa |
| API | Hono, Node 20, single Lambda bundle (incl. AWS SDK) |
| Data | DynamoDB single table `LIST#default` / `ITEM#<uuid>` + `META` |
| Translate | `translate:TranslateText` (zh ↔ en) |
| IaC | CDK v2: table, Lambda + URL, S3, CloudFront (`/api/*` → Lambda) |

## API (Lambda paths after CloudFront strip)

- `GET /items`, `POST /items`, `PATCH /items/:id`, `DELETE /items/:id`, `DELETE /items/checked`, `GET /health`

## Deploy

- `./scripts/deploy.sh` — full
- `./scripts/deploy-api.sh` — Lambda hotswap
- `./scripts/deploy-web.sh` — S3 + invalidation

See [README.md](./README.md) for setup and local dev.

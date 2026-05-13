# mai-dong-xi (买东西)

Shared **household shopping list** for everyone at home: add items from any phone or browser, check them off, clear done. **No login** — anyone with the URL can edit (keep the CloudFront URL private to your family).

**Auto-translation:** each item is stored as **English + Simplified Chinese** (`textEn` / `textZh`). Type in either language; the API fills in the other via **Amazon Translate**, with a **MyMemory** HTTP fallback when Translate is unavailable or returns non-Chinese for English input. The UI shows **English + 简体中文 + pinyin** on each line.

Architecture matches **popcorn-quest**-style serverless: **React + Vite + Tailwind PWA** on **S3 + CloudFront**, **Hono** on a **single Lambda** with **Function URL**, **DynamoDB** single-table, **AWS CDK** monorepo (`apps/api`, `apps/web`, `packages/shared`, `infra`).

---

## Repo layout

```
mai-dong-xi/
├── apps/api/          # Hono → Lambda (esbuild bundle)
├── apps/web/          # React PWA
├── packages/shared/   # Types + API contracts
├── infra/             # CDK stack (DynamoDB, Lambda, S3, CloudFront)
└── scripts/           # deploy.sh, deploy-api.sh, deploy-web.sh
```

---

## Prerequisites

- **Node.js 20+**
- **AWS CLI** configured (`aws sts get-caller-identity` works)
- **AWS CDK** bootstrapped in your account/region once:  
  `npx cdk bootstrap aws://ACCOUNT/REGION`

---

## Install & build

```bash
cd ~/Develop/mai-dong-xi
npm install
npm run build
```

---

## Local development

### 1. DynamoDB Local

```bash
docker compose up -d
./scripts/create-ddb-local-table.sh
```

### 2. API (uses DynamoDB on `localhost:8000`)

```bash
export DDB_LOCAL=1
export TABLE_NAME=MaiDongXi
npm run dev:api
```

With `DDB_LOCAL=1`, **Amazon Translate is not called**; the API uses the same **MyMemory** fallback (and local DynamoDB) so you still get bilingual strings when online.

### 3. Web (proxies `/api` → API)

```bash
npm run dev:web
```

Open **http://localhost:5173**.

---

## Deploy (production)

Full stack + web upload (same flow as popcorn-quest):

```bash
./scripts/deploy.sh
```

Faster iterations:

```bash
./scripts/deploy-api.sh    # Lambda code hotswap (~5s)
./scripts/deploy-web.sh    # S3 + small CloudFront invalidation
```

Outputs are written to **`infra/cdk-outputs.json`** (`AppUrl`, `FunctionUrl`, `BucketName`, etc.).

### IAM / Translate

The Lambda role allows **`translate:TranslateText`** on `*` (household traffic is tiny). Ensure **Amazon Translate** is available in your chosen region (e.g. `us-east-1`).

---

## API (behind CloudFront `/api/*`)

CloudFront strips the `/api` prefix; the Lambda sees:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/items` | List items (unchecked first) |
| POST | `/items` | `{ "text": "..." }` — bilingual persist |
| PATCH | `/items/:id` | `{ "checked"?: boolean, "text"?: string }` |
| DELETE | `/items/:id` | Remove one item |
| DELETE | `/items/checked` | Remove all checked items |
| GET | `/health` | `{ "ok": true }` |

---

## DynamoDB model

| PK | SK | Notes |
|----|-----|--------|
| `LIST#default` | `ITEM#<uuid>` | `textEn`, `textZh`, `checked`, `addedAt`, `checkedAt` |
| `LIST#default` | `META` | `name`, `createdAt` |

---

## Security note

**No authentication.** Anyone who can guess or obtain the URL can read and change the list. That matches the product goal; treat the URL like a shared secret.

---

## License

Private / your household — adjust as you like.

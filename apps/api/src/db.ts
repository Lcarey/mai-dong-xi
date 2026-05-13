// =============================================================================
// DynamoDB single-table access for mai-dong-xi
// =============================================================================
//
// PK = LIST#default
// SK = ITEM#<uuid>
// SK = META

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ListItem } from "@maidongxi/shared";

const region = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.TABLE_NAME || "MaiDongXi";

const local = process.env.DDB_LOCAL === "1";
const raw = new DynamoDBClient({
  region,
  ...(local
    ? {
        endpoint: process.env.DDB_LOCAL_ENDPOINT || "http://localhost:8000",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {}),
});
export const ddb = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
});

const LIST_ID = "default";
const pk = () => `LIST#${LIST_ID}`;
const skItem = (id: string) => `ITEM#${id}`;
const skMeta = () => "META";

export interface ItemRecord extends ListItem {
  PK: string;
  SK: string;
}

function toListItem(rec: Record<string, unknown>): ListItem {
  const rawQty = typeof rec.quantity === "number" ? rec.quantity : Number(rec.quantity);
  const quantity = Number.isFinite(rawQty) && rawQty >= 1 ? Math.floor(rawQty) : 1;
  return {
    id: String(rec.id ?? ""),
    textEn: String(rec.textEn ?? ""),
    textZh: String(rec.textZh ?? ""),
    quantity,
    checked: Boolean(rec.checked),
    addedAt: String(rec.addedAt ?? ""),
    checkedAt: rec.checkedAt == null ? null : String(rec.checkedAt),
  };
}

export async function listItems(): Promise<ListItem[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: { "#sk": "SK" },
      ExpressionAttributeValues: {
        ":pk": pk(),
        ":prefix": "ITEM#",
      },
    }),
  );
  const rows = (res.Items ?? []) as Record<string, unknown>[];
  const items = rows.map((r) => toListItem(r));
  items.sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.addedAt.localeCompare(b.addedAt);
  });
  return items;
}

export async function putItem(item: ListItem): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: pk(),
        SK: skItem(item.id),
        type: "ITEM",
        ...item,
      },
    }),
  );
}

export async function getItem(id: string): Promise<ListItem | null> {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skItem(id) },
    }),
  );
  if (!res.Item) return null;
  return toListItem(res.Item as Record<string, unknown>);
}

export async function updateItemChecked(
  id: string,
  checked: boolean,
  checkedAt: string | null,
): Promise<ListItem | null> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skItem(id) },
      UpdateExpression: "SET #c = :c, checkedAt = :ca",
      ExpressionAttributeNames: { "#c": "checked" },
      ExpressionAttributeValues: {
        ":c": checked,
        ":ca": checkedAt,
      },
    }),
  );
  return getItem(id);
}

export async function updateItemText(item: ListItem): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skItem(item.id) },
      UpdateExpression: "SET textEn = :en, textZh = :zh",
      ExpressionAttributeValues: {
        ":en": item.textEn,
        ":zh": item.textZh,
      },
    }),
  );
}

export async function updateItemQuantity(
  id: string,
  quantity: number,
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skItem(id) },
      UpdateExpression: "SET quantity = :q",
      ExpressionAttributeValues: { ":q": quantity },
    }),
  );
}

export async function deleteItem(id: string): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skItem(id) },
    }),
  );
}

export async function deleteAllChecked(): Promise<number> {
  const items = await listItems();
  const checked = items.filter((i) => i.checked);
  for (const i of checked) {
    await deleteItem(i.id);
  }
  return checked.length;
}

/** Ensure META row exists (idempotent). */
export async function ensureMeta(): Promise<void> {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pk(), SK: skMeta() },
    }),
  );
  if (res.Item) return;
  const now = new Date().toISOString();
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: pk(),
        SK: skMeta(),
        type: "META",
        name: "Home",
        createdAt: now,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  ).catch(() => {
    /* race: another writer created META */
  });
}

#!/usr/bin/env bash
# Create the MaiDongXi DynamoDB table in dynamodb-local (http://localhost:8000).
set -euo pipefail
ENDPOINT="${DDB_LOCAL_ENDPOINT:-http://localhost:8000}"

aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --region "${AWS_REGION:-us-east-1}" \
  --table-name MaiDongXi \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table may already exist — continuing."

echo "DynamoDB local table MaiDongXi ready at $ENDPOINT"

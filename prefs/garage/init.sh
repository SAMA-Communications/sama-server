#!/bin/sh
# One-shot Garage setup: single-node layout, access key, bucket. Safe to re-run.
A="${GARAGE_ADMIN_URL:-http://s3:3903}/v2"

get() { curl -s -H "Authorization: Bearer $GARAGE_ADMIN_TOKEN" "$A/$1"; }
post() { curl -s -H "Authorization: Bearer $GARAGE_ADMIN_TOKEN" -H "Content-Type: application/json" -d "$2" "$A/$1"; echo; }
first_id() { grep -o '"id": *"[0-9a-f]*"' | head -1 | grep -o '[0-9a-f]\{16,\}'; }

if get GetClusterStatus | grep -q '"layoutVersion": *0[,}]'; then
  NODE=$(get GetClusterStatus | first_id)
  post UpdateClusterLayout "{\"roles\":[{\"id\":\"$NODE\",\"zone\":\"dc1\",\"capacity\":10000000000,\"tags\":[]}]}"
  post ApplyClusterLayout '{"version":1}'
fi

post ImportKey "{\"accessKeyId\":\"$S3_ACCESS_KEY\",\"secretAccessKey\":\"$S3_SECRET_KEY\",\"name\":\"sama\"}"
post CreateBucket "{\"globalAlias\":\"$S3_BUCKET_NAME\"}"
BUCKET=$(get "GetBucketInfo?globalAlias=$S3_BUCKET_NAME" | first_id)
post AllowBucketKey "{\"bucketId\":\"$BUCKET\",\"accessKeyId\":\"$S3_ACCESS_KEY\",\"permissions\":{\"read\":true,\"write\":true,\"owner\":true}}"

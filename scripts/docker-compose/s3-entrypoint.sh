#!/bin/sh
set -ex

mkdir -p /data/contember
mkdir -p /data/.minio.sys/buckets/contember/
cp /src/s3-policy.json /data/.minio.sys/buckets/contember/policy.json

minio "$@"

#!/bin/sh
set -ex

mkdir -p /data/contember
mkdir -p /data/.minio.sys/buckets/contember/
cp /bucket-policy.json /data/.minio.sys/buckets/contember/policy.json

minio "$@"

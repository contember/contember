#!/bin/bash
set -e

docker build -t contember-admin:latest -f ./packages/admin-server/Dockerfile .

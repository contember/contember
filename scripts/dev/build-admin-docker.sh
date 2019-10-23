#!/bin/bash
set -e

docker build -t contember-admin:latest -f ./packages/cms-admin-server/Dockerfile .

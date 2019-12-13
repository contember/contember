#!/bin/bash
set -e

docker build -t contember:latest -f ./packages/engine-server/Dockerfile .

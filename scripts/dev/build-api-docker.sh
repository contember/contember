#!/bin/bash
set -e

docker build -t contember:latest -f ./packages/cms-api/Dockerfile .

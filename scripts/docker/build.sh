#!/bin/bash
set -e

ECR="831119889470.dkr.ecr.eu-central-1.amazonaws.com"

ecr-login

REPO="mangoweb/contember/api"
docker build -t "$ECR/$REPO:$VERSION" -f ./packages/cms-api/Dockerfile .
docker tag "$ECR/$REPO:$VERSION" "$ECR/$REPO:latest"
docker push "$ECR/$REPO"


REPO="mangoweb/contember/admin"
docker build -t "$ECR/$REPO:$VERSION" -f ./packages/cms-admin-server/Dockerfile .
docker tag "$ECR/$REPO:$VERSION" "$ECR/$REPO:latest"
docker push "$ECR/$REPO"

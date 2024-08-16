#!/usr/bin/env bash

DOCKER_BUILDKIT=1 docker build --file ./scripts/ae/ae.dockerfile --output build/api .

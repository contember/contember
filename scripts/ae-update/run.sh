#!/usr/bin/env bash

DOCKER_BUILDKIT=1 docker build --file ./scripts/ae-update/ae.dockerfile --output build/api .

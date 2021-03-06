#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$(dirname "$(dirname "$DIR")" )"

echo "DROP DATABASE IF EXISTS benchmark_tenant" | docker-compose exec -T db bash -c "psql -h localhost -U \${POSTGRES_USER} postgres"
echo "DROP DATABASE IF EXISTS benchmark_app" | docker-compose exec -T db bash -c "psql -h localhost -U \${POSTGRES_USER} postgres"

CONTAINER_NAME="$( docker-compose run -d -e APP_DB_NAME=benchmark_app -e TENANT_DB_NAME=benchmark_tenant api node --expose-gc packages/benchmark/dist/src/start-server.js )"

sleep 5

docker exec -e CONTEMBER_API_URL="http://localhost:${CONTEMBER_API_PORT}/content/app/prod" $CONTAINER_NAME node ./packages/benchmark/dist/src/setup.js
cat ./packages/benchmark/src/query.graphql | docker exec -e CONTEMBER_API_URL="http://localhost:${CONTEMBER_API_PORT}/content/app/prod" -i $CONTAINER_NAME node ./packages/benchmark/dist/src/benchmark.js  "$@"

docker stop $CONTAINER_NAME

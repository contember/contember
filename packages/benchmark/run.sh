#!/usr/bin/env bash
set -e

export $(cat .env | xargs)

echo "Cleaning"
npm run drop
echo "Starting server"
npm run start-server > /dev/null &
PID=$!
sleep 5

echo "Initializing server"
ACCESS_TOKEN=`node ./dist/src/setup.js`
export ACCESS_TOKEN

echo "Starting benchmark"
node ./dist/src/benchmark.js  "$@"

kill $PID

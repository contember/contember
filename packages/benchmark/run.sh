#!/usr/bin/env sh
set -e

echo "Cleaning"
node ./node_modules/cms-api/dist/src/bin/console drop > /dev/null 2>&1
echo "Initializing database"
node ./node_modules/cms-api/dist/src/bin/console engine:migrations:continue > /dev/null 2>&1
node ./node_modules/cms-api/dist/src/bin/console init > /dev/null 2>&1
echo "Starting server"
node --max-old-space-size=8192 ./node_modules/cms-api/dist/src/bin/console start > /dev/null 2>&1 &
PID=$!
sleep 5

echo "Initializing server"
ACCESS_TOKEN=`node ./dist/src/setup.js`
export ACCESS_TOKEN

echo "Starting benchmark"
node ./dist/src/benchmark.js  "$@"

kill $PID

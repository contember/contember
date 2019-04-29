#!/usr/bin/env sh
set -e

echo "Cleaning"
npm run console drop
echo "Initializing database"
npm run console engine:migrations:continue > /dev/null
npm run console init > /dev/null
echo "Starting server"
npm run console start > /dev/null &
PID=$!
sleep 5

echo "Initializing server"
ACCESS_TOKEN=`node ./dist/src/setup.js`
export ACCESS_TOKEN

echo "Starting benchmark"
node ./dist/src/benchmark.js  "$@"

kill $PID

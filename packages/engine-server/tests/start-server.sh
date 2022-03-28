#!/bin/bash

node ./packages/engine-server/dist/src/start.js &

max_retry=20
counter=0
until curl --silent --fail localhost:${CONTEMBER_PORT:-4000}/;
do
   sleep 1
   [[ counter -eq $max_retry ]] && echo "Failed!" && exit 1
   echo "Trying again. Try #$counter"
   ((counter++))
done

echo "Ok!"
exit 0

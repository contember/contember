#!/bin/bash

export NODE_ENV='development'
export CONTEMBER_PORT='4000'

export CONTEMBER_API_ENDPOINT='http://localhost:3001'
export CONTEMBER_LOGIN_TOKEN='1111111111111111111111111111111111111111'
export CONTEMBER_PUBLIC_DIR='./dist/public'

export CONTEMBER_S3_ENDPOINT='http://localhost:3003'
export CONTEMBER_S3_REGION='_'
export CONTEMBER_S3_BUCKET='contember'
export CONTEMBER_S3_PREFIX='admin/'
export CONTEMBER_S3_KEY='contember'
export CONTEMBER_S3_SECRET='contember'

export REDIS_HOST='redis://localhost:3006'
export REDIS_PREFIX='contember-admin-server'

cd ee/admin-server
npm run start &
npm run watch:public &
wait

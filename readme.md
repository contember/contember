# Contember

## Repository Structure

~~~
/packages = reusable TypeScript libraries
~~~

## Docker dev setup

### Initial setup

- create `docker-compose.override.yaml` using `docker-compose.override.dist.yaml`

### Regular run

- run `docker-compose up`

## Misc

We use [Lerna](https://lernajs.io/) to help with a few things

### Install or update dependencies

```sh
npm ci && \
npm run bootstrap
```

### Running and debugging individual tests in PhpStorm

Currently it is not possible to use a remote Node.js interpreter for Mocha tests so you need a local node interpreter.

- Go to `Run / Edit configurations / Templates / Mocha`
- Paste following ENV variables
```
TS_NODE_PROJECT=tsconfig.devTests.json
TEST_DB_HOST=127.0.0.1
TEST_DB_PASSWORD=contember
TEST_DB_NAME=tests
TEST_DB_PORT=4479
TEST_CWD_SUFFIX=/packages/engine-server
NODE_ENV=development
TEST_DB_USER=contember
```
- This setup will use a database from docker-compose and also there is different tsconfig file optimized for test run.
- set Extra mocha options to `--require ts-node/register --timeout 15000`
- Go to test file and run or debug it

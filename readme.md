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

Instead of `npm run bootstrap` you may also use `npm run bootstrap:hoist`. The hoist option deduplicates `node_modules` structure into one shared folder and per package differences. This makes the installation faster but the build is less reliable as it differs from CI. In case of broken symlinks you can run `lerna link` to restore them.

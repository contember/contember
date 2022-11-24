FROM node:18 as builder
ARG SERVER_DIR

WORKDIR /src
COPY ./ ./

RUN test ! -f yarn.tar.gz || tar xf yarn.tar.gz -C "$(yarn cache dir)" .
RUN /src/scripts/server/server-build.sh

FROM node:18
ARG LICENSE_FILE

WORKDIR /src

COPY --from=builder /src/server/server.js /src/
COPY --from=builder /src/server/node_modules /src/node_modules
COPY --from=builder /src/packages/engine-system-api/src/migrations /src/system-migrations
COPY --from=builder /src/packages/engine-tenant-api/src/migrations /src/tenant-migrations
COPY --from=builder /src/$SERVER_DIR/package.json /src/package.json
COPY --from=builder /src/$LICENSE_FILE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_TENANT_MIGRATIONS_DIR /src/tenant-migrations
ENV CONTEMBER_SYSTEM_MIGRATIONS_DIR /src/system-migrations
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

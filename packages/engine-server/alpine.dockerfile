FROM node:14-alpine as builder

WORKDIR /src
RUN apk --no-cache add bash
RUN apk --no-cache add --virtual builds-deps build-base python2
COPY ./ ./
RUN /src/packages/engine-server/build.sh

FROM node:14-alpine

WORKDIR /src
RUN apk --no-cache add curl

COPY --from=builder /src/server/server.js /src/
COPY --from=builder /src/server/node_modules /src/node_modules
COPY --from=builder /src/packages/engine-system-api/src/migrations /src/system-migrations
COPY --from=builder /src/packages/engine-tenant-api/src/migrations /src/tenant-migrations
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/license.md /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_TENANT_MIGRATIONS_DIR /src/tenant-migrations
ENV CONTEMBER_SYSTEM_MIGRATIONS_DIR /src/system-migrations
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

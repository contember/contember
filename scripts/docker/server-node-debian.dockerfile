FROM oven/bun:1.3.10-debian as builder

WORKDIR /src
COPY ./ ./
RUN bun install
RUN /src/scripts/server-build/run.sh

FROM node:24

WORKDIR /src
# The engine only runs `node ./server.js`; the bundled package managers are unused and their dependencies show up in image scans.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -o /usr/local/share/ca-certificates/rds-combined-ca-bundle.crt https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY --from=builder /src/dist/start.js /src/server.js
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/LICENSE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

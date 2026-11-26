FROM oven/bun:1.4.5-alpine as builder

WORKDIR /src
COPY ./ ./
RUN apk add --no-cache bash
RUN bun install --frozen-lockfile
RUN /src/scripts/server-build/run.sh

FROM oven/bun:1.4.5-alpine

WORKDIR /src
# The bun base image lags behind Alpine security fixes for OS packages (libssl3, libcrypto3, zlib, ...).
RUN apk --no-cache upgrade \
    && apk --no-cache add curl ca-certificates \
    && curl -o /usr/local/share/ca-certificates/rds-combined-ca-bundle.crt https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    && update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY --from=builder /src/dist/start.js /src/server.js
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/LICENSE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["bun", "./server.js"]

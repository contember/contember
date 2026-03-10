FROM oven/bun:1.3.10-alpine as builder

WORKDIR /src
COPY ./ ./
RUN apk add --no-cache bash
RUN bun install
RUN /src/scripts/server-build/run.sh

FROM node:24-alpine

WORKDIR /src
RUN apk --no-cache add curl ca-certificates \
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

CMD ["node", "./server.js"]

FROM oven/bun:1.2.1-debian as builder

WORKDIR /src
COPY ./ ./
RUN bun install
RUN /src/scripts/server-build/run.sh

FROM node:20

WORKDIR /src

COPY --from=builder /src/dist/start.js /src/server.js
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/LICENSE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

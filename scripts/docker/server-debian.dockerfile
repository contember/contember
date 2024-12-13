FROM node:20 as builder

WORKDIR /src
COPY ./ ./

RUN /src/scripts/server/server-build.sh

FROM node:20

WORKDIR /src

COPY --from=builder /src/server/server.js /src/
COPY --from=builder /src/node_modules /src/node_modules
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/LICENSE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

FROM node:16-alpine as builder
ARG SERVER_DIR

WORKDIR /src
RUN apk --no-cache add bash
RUN apk --no-cache add build-base python3
COPY ./ ./

RUN test ! -f yarn.tar.gz || tar xf yarn.tar.gz -C "$(yarn cache dir)" .
RUN /src/scripts/server/server-build.sh

FROM node:16-alpine
ARG LICENSE_FILE

WORKDIR /src
RUN apk --no-cache add curl

COPY --from=builder /src/server/server.js /src/
COPY --from=builder /src/server/node_modules /src/node_modules
COPY --from=builder /src/$SERVER_DIR/package.json /src/package.json
COPY --from=builder /src/$LICENSE_FILE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

FROM node:20-alpine as builder

WORKDIR /src
RUN apk --no-cache add bash
RUN apk --no-cache add build-base python3
COPY ./ ./

RUN /src/scripts/server-build/run.sh

FROM node:20-alpine

WORKDIR /src
RUN apk --no-cache add curl

COPY --from=builder /src/dist/start.js /src/server.js
COPY --from=builder /src/packages/engine-server/package.json /src/package.json
COPY --from=builder /src/LICENSE /src/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_PACKAGE_JSON /src/package.json

CMD ["node", "./server.js"]

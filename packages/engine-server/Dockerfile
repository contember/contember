FROM node:12-alpine as builder

WORKDIR /src
ENV NODE_ENV "production"
COPY ./packages/engine-server ./
COPY ./yarn.lock ./
RUN apk --no-cache add --virtual builds-deps build-base python2
RUN yarn install

FROM node:12-alpine

RUN apk --no-cache add curl

WORKDIR /src
COPY --from=builder /src/ /src

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_CONFIG_FILE "/src/config.yaml"
ENV CONTEMBER_PROJECTS_DIRECTORY "/src/projects"

CMD ["node", "./dist/src/start.js"]

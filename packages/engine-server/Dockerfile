FROM node:12 as builder

WORKDIR /src
ENV NODE_ENV "production"
COPY ./ ./
RUN sh ./packages/engine-server/init-build.sh

FROM node:12

WORKDIR /src
COPY --from=builder /src/packages/engine-server/dist/src ./dist/src
COPY --from=builder /src/packages/engine-server/node_modules ./node_modules

ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000
ENV CONTEMBER_MONITORING_PORT 4001
ENV CONTEMBER_CONFIG_FILE "/src/config.yaml"
ENV CONTEMBER_PROJECTS_DIRECTORY "/src/projects"

CMD ["node", "./dist/src/start.js"]

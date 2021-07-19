FROM node:14 as builder

WORKDIR /src
COPY ./ ./
RUN /src/packages/cli/build.sh

FROM node:14

WORKDIR /src
ENV NODE_ENV "production"

COPY --from=builder /src/dist/ /opt/contember/
COPY --from=builder /src/packages/cli-common/resources /opt/contember/resources
COPY --from=builder /src/packages/cli/package.json /opt/contember/package.json
ENV CONTEMBER_CLI_PACKAGE_ROOT /opt/contember
ENTRYPOINT ["node", "/opt/contember/run.js"]

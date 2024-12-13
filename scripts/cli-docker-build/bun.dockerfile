FROM oven/bun:latest as builder

WORKDIR /src
COPY ./ ./
RUN /src/scripts/cli-docker-build/build.sh

FROM oven/bun:1.1.38

WORKDIR /src
ENV NODE_ENV "production"

COPY --from=builder /src/dist/ /opt/contember/
COPY --from=builder /src/packages/cli/dist/resources/ /opt/contember/dist/resources/
COPY --from=builder /src/packages/cli/package.json /opt/contember/package.json
RUN ln -s /opt/contember/run.js /usr/bin/contember
ENV CONTEMBER_CLI_PACKAGE_ROOT /opt/contember
ENTRYPOINT ["bun", "/opt/contember/run.js"]

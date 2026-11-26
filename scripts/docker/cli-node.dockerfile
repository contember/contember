FROM oven/bun:1.4.5-alpine as builder

WORKDIR /src
COPY ./ ./
RUN apk add --no-cache bash
RUN bun install --frozen-lockfile
RUN /src/scripts/cli-build/run.sh --esbuild

FROM node:24-alpine

WORKDIR /src
# Drop the bundled package managers: their dependencies show up in image scans. Without npm, `workspace:update:api` cannot
# install into an npm-locked project from this image, the same as from the bun image, which never had npm.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
# The node base image lags behind Alpine security fixes for OS packages (libssl3, libcrypto3, zlib, ...).
RUN apk --no-cache upgrade
ENV NODE_ENV "production"

COPY --from=builder /src/dist/ /opt/contember/
COPY --from=builder /src/packages/cli/dist/resources/ /opt/contember/dist/resources/
COPY --from=builder /src/packages/cli/package.json /opt/contember/package.json
RUN ln -s /opt/contember/run.js /usr/bin/contember
ENV CONTEMBER_CLI_PACKAGE_ROOT /opt/contember
ENTRYPOINT ["node", "/opt/contember/run.js"]

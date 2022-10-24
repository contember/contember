FROM node:18-alpine as builder

WORKDIR /src
RUN apk --no-cache add bash
RUN apk --no-cache add build-base python3
COPY ./ ./
RUN test ! -f yarn.tar.gz || tar xf yarn.tar.gz -C "$(yarn cache dir)" .
RUN /src/packages/cli/build.sh

FROM node:18-alpine

WORKDIR /src
ENV NODE_ENV "production"

COPY --from=builder /src/dist/ /opt/contember/
COPY --from=builder /src/packages/cli/dist/src/utils/project/resources/out.css /opt/contember/resources/out.css
COPY --from=builder /src/packages/cli-common/resources /opt/contember/resources
COPY --from=builder /src/packages/cli/package.json /opt/contember/package.json
RUN ln -s /opt/contember/run.js /usr/bin/contember
ENV CONTEMBER_CLI_PACKAGE_ROOT /opt/contember
ENTRYPOINT ["node", "/opt/contember/run.js"]

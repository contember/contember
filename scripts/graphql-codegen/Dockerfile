FROM oven/bun:1.1.45 as build
WORKDIR /src
COPY package.json /src
COPY bun.lock /src
RUN bun install install
RUN bun add graphql @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-resolvers
COPY . /src
ARG PACKAGE
WORKDIR /src/packages/$PACKAGE
RUN /src/node_modules/.bin/graphql-codegen-esm --config ./graphql.codegen.yml

FROM scratch AS export
ARG PACKAGE

COPY --from=build /src/packages/$PACKAGE/src .

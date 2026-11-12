FROM oven/bun:1.3.10 AS build
WORKDIR /src
COPY . /src
RUN bun install --frozen-lockfile
# Pinned: codegen 8 pulls loaders that need fs.glob withFileTypes, which Bun lacks, and floating versions change the output.
RUN bun add --exact @graphql-codegen/cli@7.4.6 @graphql-codegen/typescript@6.1.2 @graphql-codegen/typescript-operations@6.1.10 @graphql-codegen/typescript-resolvers@6.1.1
ARG PACKAGE
WORKDIR /src/packages/$PACKAGE
# The typescript condition lets schemas built in code import workspace packages from source.
RUN bun --conditions=typescript /src/node_modules/@graphql-codegen/cli/esm/bin.js --config ./graphql.codegen.yml

FROM scratch AS export
ARG PACKAGE

COPY --from=build /src/packages/$PACKAGE/src .

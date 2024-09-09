FROM node:20-alpine as build
WORKDIR /src
COPY package.json /src
COPY yarn.lock /src
COPY .yarnrc.yml /src
COPY .yarn/ /src/.yarn/
RUN yarn install
RUN yarn add graphql @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-resolvers
COPY . /src
ARG PACKAGE
WORKDIR /src/packages/$PACKAGE
RUN /src/node_modules/.bin/graphql-codegen-esm --config ./graphql.codegen.yml

FROM scratch AS export
ARG PACKAGE

COPY --from=build /src/packages/$PACKAGE/src .

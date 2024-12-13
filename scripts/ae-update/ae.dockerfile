FROM node:20-alpine AS build

WORKDIR /src
COPY . /src
COPY package.json /src
COPY yarn.lock /src
COPY .yarnrc.yml /src
COPY .yarn/ /src/.yarn/
RUN apk add --no-cache bash
RUN yarn install --immutable
RUN yarn add @microsoft/api-extractor
RUN yarn pre-build
RUN yarn ts:build
RUN yarn ae:build

FROM scratch AS export
COPY --from=build /src/build/api .

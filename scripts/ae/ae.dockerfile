FROM node:16-alpine AS build

WORKDIR /src
COPY . /src
RUN yarn install --immutable
RUN yarn ts:build
RUN yarn ae:build

FROM scratch AS export
COPY --from=build /src/build/api .

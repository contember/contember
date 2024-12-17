FROM oven/bun:latest as build

WORKDIR /src
COPY . /src
COPY package.json /src
COPY bun.lock /src
RUN bun install --frozen-lockfile
RUN bun add @microsoft/api-extractor
RUN bun run pre-build
RUN bun run ts:build
RUN bun run ae:build

FROM scratch AS export
COPY --from=build /src/build/api .
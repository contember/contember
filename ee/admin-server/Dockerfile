FROM node:16-alpine as builder
WORKDIR /src

COPY package.json yarn.lock .yarnrc.yml								./
COPY .yarn																						./.yarn

# Enterprise Edition
COPY ee/admin-server/package.json											./ee/admin-server/package.json

# Community Edition
COPY packages/admin/package.json											./packages/admin/package.json
COPY packages/admin-i18n/package.json									./packages/admin-i18n/package.json
COPY packages/admin-sandbox/package.json							./packages/admin-sandbox/package.json
COPY packages/binding/package.json										./packages/binding/package.json
COPY packages/brand/package.json											./packages/brand/package.json
COPY packages/client/package.json											./packages/client/package.json
COPY packages/cms-layout/package.json									./packages/cms-layout/package.json
COPY packages/interface-tester/package.json						./packages/interface-tester/package.json
COPY packages/layout/package.json											./packages/layout/package.json
COPY packages/react-client/package.json								./packages/react-client/package.json
COPY packages/react-multipass-rendering/package.json	./packages/react-multipass-rendering/package.json
COPY packages/react-utils/package.json								./packages/react-utils/package.json
COPY packages/ui/package.json													./packages/ui/package.json
COPY packages/utilities/package.json									./packages/utilities/package.json
COPY packages/vimeo-file-uploader/package.json				./packages/vimeo-file-uploader/package.json
COPY packages/vite-plugin/package.json								./packages/vite-plugin/package.json

RUN yarn install

COPY ./																								./

RUN yarn as:build

FROM node:16-alpine

WORKDIR /src
COPY --from=builder /src/ee/admin-server/dist/				./

ENV NODE_ENV "production"
ENV CONTEMBER_PORT "4000"
ENV CONTEMBER_PUBLIC_DIR "/src/public"
ENV CONTEMBER_S3_ENDPOINT ""
ENV CONTEMBER_S3_PREFIX ""
ENV CONTEMBER_S3_KEY ""
ENV CONTEMBER_S3_SECRET ""

CMD ["node", "./server/run-admin.js"]

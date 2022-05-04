FROM node:16-alpine as builder
WORKDIR /src

RUN npm install -g pnpm@6

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ee/admin-server/package.json                    ./ee/admin-server/package.json
COPY packages/admin/package.json                     ./packages/admin/package.json
COPY packages/admin-i18n/package.json                ./packages/admin-i18n/package.json
COPY packages/admin-sandbox/package.json             ./packages/admin-sandbox/package.json
COPY packages/binding/package.json                   ./packages/binding/package.json
COPY packages/client/package.json                    ./packages/client/package.json
COPY packages/react-client/package.json              ./packages/react-client/package.json
COPY packages/react-multipass-rendering/package.json ./packages/react-multipass-rendering/package.json
COPY packages/react-utils/package.json               ./packages/react-utils/package.json
COPY packages/ui/package.json                        ./packages/ui/package.json
COPY packages/vimeo-file-uploader/package.json       ./packages/vimeo-file-uploader/package.json

RUN cd ee/admin-server && pnpm install

COPY ./ ./

RUN cd ee/admin-server && pnpm run build

FROM node:16-alpine

WORKDIR /src
COPY --from=builder /src/ee/admin-server/dist/ ./

ENV NODE_ENV "production"
ENV CONTEMBER_PORT "4000"
ENV CONTEMBER_PUBLIC_DIR "/src/public"
ENV CONTEMBER_S3_ENDPOINT ""
ENV CONTEMBER_S3_PREFIX ""
ENV CONTEMBER_S3_KEY ""
ENV CONTEMBER_S3_SECRET ""

CMD ["node", "./server/run-admin.js"]

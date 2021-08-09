FROM node:14-alpine as builder
WORKDIR /src

RUN npm install -g pnpm

COPY ./ ./

RUN cd packages/admin-server && \
    pnpm install && \
    pnpm run build

FROM node:14-alpine

WORKDIR /src
COPY --from=builder /src/packages/admin-server/dist/run-admin.js ./
COPY --from=builder /src/packages/admin-server/dist/index.html   ./public/
COPY --from=builder /src/packages/admin-server/dist/_static      ./public/_static/

ENV NODE_ENV "production"
ENV CONTEMBER_PORT "4000"
ENV CONTEMBER_PUBLIC_DIR "/src/public"

CMD ["node", "./run-admin.js"]

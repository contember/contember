FROM node:12 as builder

WORKDIR /src
ENV NODE_ENV "production"
COPY ./ ./
RUN sh ./packages/admin-server/init-build.sh

FROM node:12

WORKDIR /src
COPY --from=builder /src/packages/admin-server ./
ENV NODE_ENV "production"
ENV CONTEMBER_INDEX /src/public/index.html
ENV CONTEMBER_CONFIG_PLACEHOLDER "{configuration}"
ENV CONTEMBER_PORT 4000

CMD ["node", "./dist/src/run-admin.js"]

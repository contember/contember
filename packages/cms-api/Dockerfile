FROM node:12 as builder

WORKDIR /src
ENV NODE_ENV "production"
COPY ./ ./
RUN sh ./packages/cms-api/init-build.sh

FROM node:12

WORKDIR /src
COPY --from=builder /src/packages/cms-api/dist/src ./dist/src
COPY --from=builder /src/packages/cms-api/node_modules ./node_modules
ENV NODE_ENV "production"
ENV CONTEMBER_PORT 4000

CMD ["node", "./dist/src/start.js"]

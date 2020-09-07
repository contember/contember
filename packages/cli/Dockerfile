FROM node:12 as builder

WORKDIR /src
ENV NODE_ENV "production"
COPY ./packages/cli ./
COPY ./yarn.lock ./
RUN yarn install

FROM node:12

ENV DOCKER_VERSION 19.03.5
ENV DOCKER_COMPOSE_VERSION 1.25.3

WORKDIR /src

RUN curl -Ls "https://download.docker.com/linux/debian/dists/stretch/pool/stable/amd64/docker-ce-cli_${DOCKER_VERSION}~3-0~debian-stretch_amd64.deb" -o docker.deb && \
	dpkg -i docker.deb && \
	rm docker.deb && \
	curl -Ls "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
	chmod +x /usr/local/bin/docker-compose

COPY --from=builder /src/ /opt/contember/

ENTRYPOINT ["bash", "/opt/contember/run.sh"]

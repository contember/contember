# Contember Sandbox

## While developing Admin locally outside the Docker

1. Install [pnpm](https://pnpm.io/) if you haven't already. `npm -g install pnpm`
1. Run `pnpm install`
1. Run `cp docker-compose.override.dev-admin.yaml docker-compose.override.yaml`
1. Run `docker-compose up --detach`
1. Run `docker-compose run contember-cli migrations:execute admin-sandbox`
1. Run `pnpm run vite`

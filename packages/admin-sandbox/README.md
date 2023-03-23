# Contember Sandbox

## While developing Admin locally outside the Docker

1. Install yarn
1. Run `yarn instal`
1. Run `cp docker-compose.override.dev-admin.yaml docker-compose.override.yaml`
1. Run `docker-compose up --detach`
1. Run `docker-compose run contember-cli migrations:execute admin-sandbox`
1. Run `yarn run vite`

## Linking local development folder in your project (for debugging only)

> **IMPORTANT:**
> It is highly recommended to add as much test cases in the Admin Sandbox
> as possible before resorting to linking local version of Contember Admin.

If you find hard to replicate issues in Sandbox, you might want to try to
[link Contember Admin](./README.link-local.md)

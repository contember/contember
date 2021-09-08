# Contember Admin

## Contributing
If you wish to send a pull request, be sure to first consult the maintainers by creating an issue. We typically react
very quickly and are happy to provide any guidance.

## Local setup
1. Install [pnpm](https://pnpm.io/) if you haven't already. `npm -g install pnpm`
2. Run `pnpm install`
3. Run `docker-compose up`
4. Run `docker-compose run contember-cli migrations:execute admin-sandbox`

## UI development
Run `pnpm run storybook`. Add/edit stories in `packages/ui/stories`.

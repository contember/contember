# Contember Admin

## Contributing
If you wish to send a pull request, be sure to first consult the maintainers by creating an issue. We typically react
very quickly and are happy to provide any guidance.

## Local setup
1. Install [pnpm](https://pnpm.io/) if you haven't already.
2. Obtain an auth token for the private NPM registry. Ask [@jirkavebr](https://github.com/jirkavebr) if you need one.
3. Run `VERDACCIO_NPM_TOKEN="…token here…" pnpm install` using said token.

## UI development
Run `pnpm run storybook`. Add/edit stories in `packages/ui/stories`.

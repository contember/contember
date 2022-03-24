<a href="https://www.contember.com/#gh-light-mode-only" target="_blank">
  <img src="https://user-images.githubusercontent.com/47249487/159670980-2ccedc7c-90ca-4262-957d-9d000f4a4a25.svg" width="100%" />
</a>
<a href="https://www.contember.com/#gh-dark-mode-only" target="_blank">
  <img src="https://user-images.githubusercontent.com/47249487/159670893-6ac23242-386a-482b-98b5-481488208403.svg" width="100%" />
</a>

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

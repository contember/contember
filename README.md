<a href="https://www.contember.com/" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/47249487/159670893-6ac23242-386a-482b-98b5-481488208403.svg">
      <img src="https://user-images.githubusercontent.com/47249487/159670980-2ccedc7c-90ca-4262-957d-9d000f4a4a25.svg" width="100%">
    </picture>
</a>

# Contember Interface

Contember is an open source headless development platform. It makes it easy to build, maintain and operate systems for managing any type of content. Enjoy GraphQL API, role-based access control, authentication and a well-structured PostgreSQL database. Built by developers for developers.

- [Start building with Contember](https://www.contember.com/start)
- [Documentation](https://docs.contember.com/)

## Contributing
If you wish to send a pull request, be sure to first consult the maintainers by creating an issue. We typically react
very quickly and are happy to provide any guidance.

### Local development setup
1. Install [yarn v3](https://yarnpkg.com/getting-started/install) if you haven't already.
```bash
corepack enable
corepack prepare yarn@stable --activate
```
2. Run `yarn install`
3. Run `docker-compose up`
4. Run `test -f docker-compose.override.yaml || cp docker-compose.override.dist.yaml docker-compose.override.yaml`
5. Run `docker-compose run contember-cli migrations:execute admin-sandbox`

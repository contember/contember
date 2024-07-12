<div align="center">
	<a href="https://www.contember.com/" target="_blank">
			<picture>
				<source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo_l.svg">
				<img height="220" alt="Contember Interface logo (dark or light)" src=".github/assets/logo_d.svg">
		</picture>
	</a>
</div>


# Contember

Contember is an open-source platform that empowers developers to quickly build and manage data-driven web applications. It gives you full control over the administration interface and data structure. Enjoy GraphQL API, role-based access control, authentication and a well-structured PostgreSQL database. Built by developers for developers.

- [Start building with Contember](https://www.contember.com/start)
- [Documentation](https://docs.contember.com/)

## Contributing
If you wish to send a pull request, be sure to first consult the maintainers by creating an issue. We typically react
very quickly and are happy to provide any guidance.

### Local development setup
1. Install [yarn classic](https://classic.yarnpkg.com/en/docs/install) or [yarn v3](https://yarnpkg.com/getting-started/install) if you haven't already.
2. Run `yarn install`
3. Run `docker-compose up`
4. Run `test -f docker-compose.override.yaml || cp docker-compose.override.dist.yaml docker-compose.override.yaml`
5. Run `yarn contember migrations:execute`

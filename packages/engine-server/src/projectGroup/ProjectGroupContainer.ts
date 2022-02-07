import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { TenantConfig } from '../config/config'
import { ProjectGroupContainer, Providers, TenantGraphQLHandlerFactory } from '@contember/engine-http'
import {
	ProjectContainerFactoryFactory,
	ProjectContainerResolver,
	ProjectInitializer,
	ProjectInitializerProxy,
	ProjectSchemaResolver,
	ProjectSchemaResolverProxy,
} from '../project'
import { SystemContainerFactory } from '@contember/engine-system-api'
import { ProjectConfigResolver } from '../config/projectConfigResolver'
import { SystemGraphQLHandlerFactory } from '@contember/engine-http'

interface ProjectGroupContainerFactoryArgs
{
	config: TenantConfig
}

export class ProjectGroupContainerFactory {
	constructor(
		private readonly providers: Providers,
		private readonly systemContainerFactory: SystemContainerFactory,
		private readonly tenantContainerFactory: TenantContainerFactory,
		private readonly projectContainerFactoryFactory: ProjectContainerFactoryFactory,
		private readonly projectConfigResolver: ProjectConfigResolver,
		private readonly tenantGraphQLHandlerFactory: TenantGraphQLHandlerFactory,
		private readonly systemGraphQLHandlerFactory: SystemGraphQLHandlerFactory,
	) {}

	public create({ config }: ProjectGroupContainerFactoryArgs): ProjectGroupContainer {
		return new Builder({})
			.addService('providers', () =>
				this.providers)
			.addService('tenantConnection', (): Connection.ConnectionType =>
				new Connection(config.db, {}))
			.addService('projectSchemaResolver', () =>
				new ProjectSchemaResolverProxy())
			.addService('projectInitializer', () =>
				new ProjectInitializerProxy())
			.addService('tenantContainer', ({ tenantConnection, projectSchemaResolver, projectInitializer }) =>
				this.tenantContainerFactory.create({
					connection: tenantConnection,
					mailOptions: config.mailer,
					tenantCredentials: config.credentials,
					projectInitializer,
					projectSchemaResolver,
				}))
			.addService('tenantDatabase', ({ tenantContainer }) =>
				tenantContainer.databaseContext)
			.addService('identityFetcher', ({ tenantContainer: { identityFetcher } }) =>
				identityFetcher)
			.addService('systemContainer', ({ identityFetcher }) =>
				this.systemContainerFactory.create({ identityFetcher }))
			.addService('schemaVersionBuilder', ({ systemContainer }) =>
				systemContainer.schemaVersionBuilder)
			.addService('projectContainerFactory', ({  schemaVersionBuilder }) =>
				this.projectContainerFactoryFactory.create(schemaVersionBuilder))
			.addService('tenantProjectManager', ({ tenantContainer }) =>
				tenantContainer.projectManager)
			.addService('projectContainerResolver', ({ projectContainerFactory, tenantProjectManager, systemContainer, tenantContainer }) =>
				new ProjectContainerResolver(
					projectContainerFactory,
					this.projectConfigResolver,
					tenantProjectManager,
					systemContainer.projectInitializer,
					tenantContainer.databaseContext,
				))

			.setupService('projectSchemaResolver', (it, { projectContainerResolver, schemaVersionBuilder }) => {
				it.setResolver(new ProjectSchemaResolver(projectContainerResolver, schemaVersionBuilder))
			})
			.setupService('projectInitializer', (it, { projectContainerResolver }) => {
				it.setInitializer(new ProjectInitializer(projectContainerResolver))
			})
			.addService('tenantGraphQLMiddleware', ({ tenantContainer }) =>
				this.tenantGraphQLHandlerFactory.create(tenantContainer.resolvers))
			.addService('systemGraphQLMiddleware', ({ systemContainer }) =>
				this.systemGraphQLHandlerFactory.create(systemContainer.systemResolversFactory))
			.build()
			.pick(
				'projectContainerResolver',
				'projectSchemaResolver',
				'projectInitializer',
				'systemContainer',
				'systemGraphQLMiddleware',
				'tenantContainer',
				'tenantDatabase',
				'tenantGraphQLMiddleware',
			)
	}
}

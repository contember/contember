import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { TenantConfig } from '../config/config'
import {
	Authenticator,
	CryptoWrapper,
	ProjectGroupContainer,
	ProjectMembershipFetcher,
	ProjectMembershipResolver,
	Providers,
	SystemGraphQLHandlerFactory,
	TenantGraphQLHandlerFactory,
} from '@contember/engine-http'
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
import { createSecretKey } from 'crypto'

interface ProjectGroupContainerFactoryArgs
{
	config: TenantConfig
	slug: string | undefined
}

export class ProjectGroupContainerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly providers: Providers,
		private readonly systemContainerFactory: SystemContainerFactory,
		private readonly tenantContainerFactory: TenantContainerFactory,
		private readonly projectContainerFactoryFactory: ProjectContainerFactoryFactory,
		private readonly projectConfigResolver: ProjectConfigResolver,
		private readonly tenantGraphQLHandlerFactory: TenantGraphQLHandlerFactory,
		private readonly systemGraphQLHandlerFactory: SystemGraphQLHandlerFactory,
	) {}

	public create({ config, slug }: ProjectGroupContainerFactoryArgs): ProjectGroupContainer {
		return new Builder({})
			.addService('slug', () =>
				slug)
			.addService('providers', () =>
				this.providers)
			.addService('tenantDbCredentials', () =>
				config.db)
			.addService('tenantConnection', ({ tenantDbCredentials }): Connection.ConnectionType =>
				Connection.create(tenantDbCredentials))
			.addService('projectSchemaResolver', () =>
				new ProjectSchemaResolverProxy())
			.addService('projectInitializer', () =>
				new ProjectInitializerProxy())
			.addService('tenantContainer', ({ tenantConnection, tenantDbCredentials, projectSchemaResolver, projectInitializer }) => {
				const encryptionKey = config.secrets.encryptionKey
					? createSecretKey(Buffer.from(config.secrets.encryptionKey, 'hex'))
					: undefined

				const cryptoWrapper = new CryptoWrapper(encryptionKey)
				return this.tenantContainerFactory.create({
					connection: tenantConnection,
					dbCredentials: tenantDbCredentials,
					mailOptions: config.mailer,
					tenantCredentials: config.credentials,
					projectInitializer,
					projectSchemaResolver,
					cryptoProviders: {
						decrypt: cryptoWrapper.decrypt.bind(cryptoWrapper),
						encrypt: cryptoWrapper.encrypt.bind(cryptoWrapper),
					},
				})
			})
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
					config,
				))

			.setupService('projectSchemaResolver', (it, { projectContainerResolver, schemaVersionBuilder }) => {
				it.setResolver(new ProjectSchemaResolver(projectContainerResolver, schemaVersionBuilder))
			})
			.setupService('projectInitializer', (it, { projectContainerResolver }) => {
				it.setInitializer(new ProjectInitializer(projectContainerResolver))
			})
			.addService('tenantGraphQLHandler', ({ tenantContainer }) =>
				this.tenantGraphQLHandlerFactory.create(tenantContainer.resolvers))
			.addService('systemGraphQLHandler', ({ systemContainer }) =>
				this.systemGraphQLHandlerFactory.create(systemContainer.systemResolversFactory))
			.addService('authenticator', ({ tenantDatabase, tenantContainer }) =>
				new Authenticator(tenantDatabase, tenantContainer.apiKeyManager))
			.addService('projectMembershipResolver', ({ tenantContainer }) =>
				new ProjectMembershipResolver(this.debug, new ProjectMembershipFetcher(tenantContainer.projectMemberManager, tenantContainer.databaseContext)))
			.build()
			.pick(
				'projectContainerResolver',
				'projectSchemaResolver',
				'projectInitializer',
				'systemContainer',
				'systemGraphQLHandler',
				'tenantContainer',
				'tenantDatabase',
				'authenticator',
				'projectMembershipResolver',
				'tenantGraphQLHandler',
				'slug',
			)
	}
}

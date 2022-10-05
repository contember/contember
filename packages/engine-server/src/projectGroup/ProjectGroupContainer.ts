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
import { Logger } from '@contember/logger'

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
		private readonly logger: Logger,
	) {}

	public create({ config, slug }: ProjectGroupContainerFactoryArgs): ProjectGroupContainer {
		return new Builder({})
			.addService('slug', () =>
				slug)
			.addService('logger', ({ slug }) =>
				this.logger.child({ projectGroup: slug }))
			.addService('providers', () =>
				this.providers)
			.addService('tenantDbCredentials', () =>
				config.db)
			.addService('tenantConnection', ({ tenantDbCredentials, logger }): Connection.ConnectionType =>
				Connection.create(tenantDbCredentials, err => logger.error(err)))
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
			.addService('projectContainerFactory', ({  schemaVersionBuilder, logger }) =>
				this.projectContainerFactoryFactory.create(schemaVersionBuilder, logger))
			.addService('tenantProjectManager', ({ tenantContainer }) =>
				tenantContainer.projectManager)
			.addService('projectContainerResolver', ({ projectContainerFactory, tenantProjectManager, tenantContainer }) =>
				new ProjectContainerResolver(
					projectContainerFactory,
					this.projectConfigResolver,
					tenantProjectManager,
					tenantContainer.databaseContext,
					config,
				))

			.setupService('projectSchemaResolver', (it, { projectContainerResolver }) => {
				it.setResolver(new ProjectSchemaResolver(projectContainerResolver))
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
				'logger',
			)
	}
}

import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import {
	ProjectInitializer as ProjectInitializerInterface,
	ProjectSchemaResolver as ProjectSchemaResolverInterface,
	TenantContainer,
	TenantContainerFactory,
} from '@contember/engine-tenant-api'
import { TenantConfig } from '../config/config'
import {
	ProjectContainerFactoryFactory,
	ProjectContainerResolver,
	ProjectInitializer,
	ProjectInitializerProxy,
	ProjectSchemaResolver,
	ProjectSchemaResolverProxy,
} from '../project'
import { SystemContainer, SystemContainerFactory } from '@contember/engine-system-api'
import { ProjectConfigResolver } from '../config/projectConfigResolver'
import { createSecretKey } from 'node:crypto'
import { Logger } from '@contember/logger'
import { TenantGraphQLHandler, TenantGraphQLHandlerFactory } from '../tenant'
import { SystemGraphQLHandler, SystemGraphQLHandlerFactory } from '../system'
import { Authenticator } from '../common'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../content'
import { Providers } from '../providers'
import { CryptoWrapper } from '../utils/CryptoWrapper'

export interface ProjectGroupContainer {
	slug: string | undefined

	logger: Logger
	authenticator: Authenticator
	projectMembershipResolver: ProjectMembershipResolver

	projectContainerResolver: ProjectContainerResolver
	projectSchemaResolver: ProjectSchemaResolverInterface
	projectInitializer: ProjectInitializerInterface

	tenantContainer: TenantContainer
	tenantGraphQLHandler: TenantGraphQLHandler

	systemContainer: SystemContainer
	systemGraphQLHandler: SystemGraphQLHandler
}


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
			.addService('tenantReadConnection', ({ tenantDbCredentials, logger, tenantConnection }) => {
				if (!tenantDbCredentials.read) {
					return tenantConnection
				}
				return Connection.create({
					...tenantDbCredentials,
					...tenantDbCredentials.read,
					pool: {
						...tenantDbCredentials.pool,
						...tenantDbCredentials.read.pool,
					},
				}, err => logger.error(err))
			})
			.addService('projectSchemaResolver', () =>
				new ProjectSchemaResolverProxy())
			.addService('projectInitializer', () =>
				new ProjectInitializerProxy())
			.addService('tenantContainer', ({ tenantConnection, tenantReadConnection, tenantDbCredentials, projectSchemaResolver, projectInitializer }) => {
				const encryptionKey = config.secrets.encryptionKey
					? createSecretKey(Buffer.from(config.secrets.encryptionKey, 'hex'))
					: undefined

				const cryptoWrapper = new CryptoWrapper(encryptionKey)
				return this.tenantContainerFactory.create({
					connection: tenantConnection,
					readConnection: tenantReadConnection,
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
			.addService('tenantReadDatabase', ({ tenantContainer }) =>
				tenantContainer.readDatabaseContext)
			.addService('identityFetcher', ({ tenantContainer: { identityFetcher } }) =>
				identityFetcher)
			.addService('systemContainer', ({ identityFetcher }) =>
				this.systemContainerFactory.create({ identityFetcher }))
			.addService('schemaProvider', ({ systemContainer }) =>
				systemContainer.schemaProvider)
			.addService('projectContainerFactory', ({ schemaProvider, logger }) =>
				this.projectContainerFactoryFactory.create(schemaProvider, logger))
			.addService('tenantProjectManager', ({ tenantContainer }) =>
				tenantContainer.projectManager)
			.addService('tenantProjectMemberManager', ({ tenantContainer }) =>
				tenantContainer.projectMemberManager)
			.addService('projectContainerResolver', ({ projectContainerFactory, tenantProjectManager, tenantReadDatabase }) =>
				new ProjectContainerResolver(
					projectContainerFactory,
					this.projectConfigResolver,
					tenantProjectManager,
					tenantReadDatabase,
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
			.addService('authenticator', ({ tenantDatabase, tenantReadDatabase, tenantContainer }) =>
				new Authenticator(tenantDatabase, tenantReadDatabase, tenantContainer.apiKeyManager))
			.addService('projectMembershipResolver', ({ tenantProjectMemberManager, tenantReadDatabase }) =>
				new ProjectMembershipResolver(this.debug, new ProjectMembershipFetcher(tenantProjectMemberManager, tenantReadDatabase)))
			.build()
			.pick(
				'projectContainerResolver',
				'projectSchemaResolver',
				'projectInitializer',
				'systemContainer',
				'systemGraphQLHandler',
				'tenantContainer',
				'authenticator',
				'projectMembershipResolver',
				'tenantGraphQLHandler',
				'slug',
				'logger',
			)
	}
}

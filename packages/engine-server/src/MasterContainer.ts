import {
	ContentApplyDependenciesFactoryImpl,
	ContentEventApplier,
	createMapperContainer,
	EntitiesSelector,
	EntitiesSelectorMapperFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import getTenantMigrations from '@contember/engine-tenant-api/migrations'
import getSystemMigrations from '@contember/engine-system-api/migrations'
import { Builder } from '@contember/dic'
import { Config } from './config/config'
import { createDbMetricsRegistrar, logSentryError, ProcessType } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import { DatabaseCredentials, MigrationsRunner } from '@contember/database-migrations'
import { createRootMiddleware, createShowMetricsMiddleware } from './http'
import {
	createProviders,
	Koa,
	ProjectConfigResolver,
	SystemGraphQLMiddlewareFactory,
	TenantGraphQLMiddlewareFactory,
} from '@contember/engine-http'
import prom from 'prom-client'
import {
	ProjectContainerFactory,
	ProjectContainerResolver,
	ProjectInitializer,
	ProjectInitializerProxy,
	ProjectSchemaResolver,
	ProjectSchemaResolverProxy,
} from './project'
import { ClientBase } from 'pg'
import { createSecretKey } from 'crypto'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	monitoringKoa: Koa
	projectContainerResolver: ProjectContainerResolver
}

export interface MasterContainerArgs {
	debugMode: boolean
	config: Config
	projectConfigResolver: ProjectConfigResolver
	plugins: Plugin[]
	processType: ProcessType
	version?: string
}

export class MasterContainerFactory {
	create({
		config,
		debugMode,
		plugins,
		projectConfigResolver,
		processType,
		version,
	}: MasterContainerArgs): MasterContainer {
		const masterContainer = new Builder({})
			.addService('config', () => config)
			.addService('debugMode', () => debugMode)
			.addService('processType', () => processType)
			.addService('version', () => version)
			.addService('projectConfigResolver', () => projectConfigResolver)
			.addService('plugins', () => plugins)
			.addService(
				'tenantContainerFactory',
				({ config }) => new TenantContainerFactory(config.tenant.db, config.tenant.mailer),
			)
			.addService('systemContainerFactory', () => new SystemContainerFactory())

			.addService('providers', ({ config }) =>
				createProviders({
					encryptionKey: config.tenant.secrets
						? createSecretKey(Buffer.from(config.tenant.secrets.encryptionKey, 'hex'))
						: undefined,
				}),
			)
			.addService('projectSchemaResolver', () => new ProjectSchemaResolverProxy())
			.addService('projectInitializer', () => new ProjectInitializerProxy())
			.addService(
				'tenantContainer',
				({ tenantContainerFactory, providers, projectSchemaResolver, projectInitializer }) =>
					tenantContainerFactory.create({
						providers,
						projectSchemaResolver,
						projectInitializer,
					}),
			)
			.addService(
				'modificationHandlerFactory',
				() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
			)
			.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
			.addService('entitiesSelector', ({ permissionsByIdentityFactory, providers }) => {
				const mapperFactory: EntitiesSelectorMapperFactory = (db, schema, identityVariables, permissions) =>
					createMapperContainer({
						schema,
						identityVariables,
						permissions,
						providers,
					}).mapperFactory(db)
				return new EntitiesSelector(mapperFactory, permissionsByIdentityFactory)
			})
			.addService('identityFetcher', ({ tenantContainer }) => tenantContainer.identityFetcher)
			.addService('eventApplier', () => {
				return new ContentEventApplier(new ContentApplyDependenciesFactoryImpl())
			})
			.addService(
				'systemDbMigrationsRunnerFactory',
				() => (db: DatabaseCredentials, dbClient: ClientBase) =>
					new MigrationsRunner(db, 'system', getSystemMigrations, dbClient),
			)
			.addService(
				'systemContainer',
				({
					systemContainerFactory,
					entitiesSelector,
					eventApplier,
					identityFetcher,
					modificationHandlerFactory,
					providers,
					systemDbMigrationsRunnerFactory,
				}) =>
					systemContainerFactory.create({
						entitiesSelector,
						eventApplier,
						identityFetcher,
						modificationHandlerFactory,
						providers,
						systemDbMigrationsRunnerFactory,
					}),
			)
			.addService('schemaVersionBuilder', ({ systemContainer }) => systemContainer.schemaVersionBuilder)
			.addService(
				'projectContainerFactory',
				({ debugMode, plugins, schemaVersionBuilder, providers }) =>
					new ProjectContainerFactory(debugMode, plugins, schemaVersionBuilder, providers),
			)
			.addService('tenantProjectManager', ({ tenantContainer }) => tenantContainer.projectManager)
			.addService(
				'projectContainerResolver',
				({ tenantProjectManager, projectContainerFactory, projectConfigResolver }) =>
					new ProjectContainerResolver(projectContainerFactory, projectConfigResolver, tenantProjectManager),
			)
			.addService(
				'tenantGraphQlMiddlewareFactory',
				({ tenantContainer }) =>
					new TenantGraphQLMiddlewareFactory(
						tenantContainer.resolvers,
						tenantContainer.resolverContextFactory,
						logSentryError,
					),
			)
			.addService(
				'systemGraphQLMiddlewareFactory',
				({ systemContainer, debugMode }) =>
					new SystemGraphQLMiddlewareFactory(
						systemContainer.systemResolversFactory,
						systemContainer.resolverContextFactory,
						logSentryError,
						debugMode,
					),
			)

			.addService('promRegistry', ({ projectContainerResolver, processType, tenantContainer }) => {
				if (processType === ProcessType.clusterMaster) {
					const register = new prom.AggregatorRegistry()
					prom.collectDefaultMetrics({ register })
					return register
				}
				const register = prom.register
				prom.collectDefaultMetrics({ register })
				const registrar = createDbMetricsRegistrar(register)
				registrar({ connection: tenantContainer.connection, module: 'tenant', project: 'unknown' })
				projectContainerResolver.onCreate.push(container =>
					registrar({
						connection: container.connection,
						module: 'content',
						project: container.project.slug,
					}),
				)
				return register
			})
			.addService(
				'koa',
				({
					tenantGraphQlMiddlewareFactory,
					projectContainerResolver,
					tenantContainer,
					providers,
					systemGraphQLMiddlewareFactory,
					promRegistry,
					debugMode,
					version,
					config,
				}) => {
					const app = new Koa()
					app.use(
						createRootMiddleware(
							debugMode,
							version ?? 'unknown',
							{
								tenantGraphQlMiddlewareFactory,
								projectContainerResolver: projectContainerResolver.getProjectContainer.bind(projectContainerResolver),
								apiKeyManager: tenantContainer.apiKeyManager,
								projectMemberManager: tenantContainer.projectMemberManager,
								providers,
								systemGraphQLMiddlewareFactory,
							},
							promRegistry,
							config.server.http,
						),
					)

					return app
				},
			)
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})
			.addService(
				'tenantMigrationsRunner',
				({ config }) => new MigrationsRunner(config.tenant.db, 'tenant', getTenantMigrations),
			)
			.addService(
				'initializer',
				({ tenantMigrationsRunner, tenantContainer, systemContainer, projectContainerResolver, config, providers }) =>
					new Initializer(
						tenantMigrationsRunner,
						tenantContainer.projectManager,
						systemContainer.projectInitializer,
						projectContainerResolver,
						config.tenant.credentials,
						providers,
					),
			)
			.setupService('projectSchemaResolver', (it, { projectContainerResolver, schemaVersionBuilder }) => {
				it.setResolver(
					new ProjectSchemaResolver(
						projectContainerResolver.getProjectContainer.bind(projectContainerResolver),
						schemaVersionBuilder,
					),
				)
			})
			.setupService('projectInitializer', (it, { projectContainerResolver, systemContainer }) => {
				it.setInitializer(new ProjectInitializer(projectContainerResolver, systemContainer.projectInitializer))
			})
			.build()

		return masterContainer.pick('initializer', 'koa', 'monitoringKoa', 'projectContainerResolver')
	}
}

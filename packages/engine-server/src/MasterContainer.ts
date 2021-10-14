import {
	ContentApplyDependenciesFactoryImpl,
	ContentEventApplier,
	createMapperContainer,
	EntitiesSelector,
	EntitiesSelectorMapperFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { SystemContainerFactory } from '@contember/engine-system-api'
import { ProjectInitializer as ProjectInitializerInterface, TenantContainerFactory } from '@contember/engine-tenant-api'
import getSystemMigrations from '@contember/engine-system-api/migrations'
import { Builder } from '@contember/dic'
import { Config } from './config/config'
import { createDbMetricsRegistrar, logSentryError, ProcessType } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import { DatabaseCredentials, MigrationsRunner } from '@contember/database-migrations'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './http'
import {
	ApiMiddlewareFactory,
	AuthMiddlewareFactory,
	compose,
	ContentServerMiddlewareFactory,
	createHomepageMiddleware,
	createPlaygroundMiddleware,
	createPoweredByHeaderMiddleware,
	createProviders,
	createTimerMiddleware,
	ErrorFactory,
	Koa,
	NotModifiedMiddlewareFactory,
	ProjectConfigResolver,
	ProjectGroupMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
	Providers,
	route,
	StageResolveMiddlewareFactory,
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
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	monitoringKoa: Koa
	projectContainerResolver: ProjectContainerResolver
	projectInitializer: ProjectInitializerInterface
	providers: Providers
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
			.addService('config', () =>
				config)
			.addService('debugMode', () =>
				debugMode)
			.addService('processType', () =>
				processType)
			.addService('version', () =>
				version)
			.addService('projectConfigResolver', () =>
				projectConfigResolver)
			.addService('plugins', () =>
				plugins)
			.addService('tenantContainerFactory', ({ config }) =>
				new TenantContainerFactory(config.tenant.db, config.tenant.mailer, config.tenant.credentials))
			.addService('systemContainerFactory', () =>
				new SystemContainerFactory())
			.addService('providers', ({ config }) => {
				const encryptionKey = config.tenant.secrets
					? createSecretKey(Buffer.from(config.tenant.secrets.encryptionKey, 'hex'))
					: undefined
				return createProviders({ encryptionKey })
			})
			.addService('projectSchemaResolver', () =>
				new ProjectSchemaResolverProxy())
			.addService('projectInitializer', () =>
				new ProjectInitializerProxy())
			.addService('tenantContainer', ({ tenantContainerFactory, providers, projectSchemaResolver, projectInitializer }) =>
				tenantContainerFactory.create({
					providers,
					projectSchemaResolver,
					projectInitializer,
				}))
			.addService('modificationHandlerFactory', () =>
				new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
			.addService('permissionsByIdentityFactory', ({}) =>
				new PermissionsByIdentityFactory())
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
			.addService('eventApplier', () =>
				new ContentEventApplier(new ContentApplyDependenciesFactoryImpl()))
			.addService('systemDbMigrationsRunnerFactory', () =>
				(db: DatabaseCredentials, dbClient: ClientBase) =>
					new MigrationsRunner(db, 'system', getSystemMigrations, dbClient))
			.addService('systemContainer', ({ systemContainerFactory, entitiesSelector, eventApplier, modificationHandlerFactory, providers, systemDbMigrationsRunnerFactory }) =>
				systemContainerFactory.create({
					entitiesSelector,
					eventApplier,
					modificationHandlerFactory,
					providers,
					systemDbMigrationsRunnerFactory,
				}))
			.addService('schemaVersionBuilder', ({ systemContainer }) =>
				systemContainer.schemaVersionBuilder)
			.addService('projectContainerFactory', ({ debugMode, plugins, schemaVersionBuilder, providers }) =>
				new ProjectContainerFactory(debugMode, plugins, schemaVersionBuilder, providers))
			.addService('tenantProjectManager', ({ tenantContainer }) =>
				tenantContainer.projectManager)
			.addService('projectContainerResolver', ({ tenantProjectManager, projectContainerFactory, projectConfigResolver }) =>
				new ProjectContainerResolver(projectContainerFactory, projectConfigResolver, tenantProjectManager))
			.addService('tenantGraphQlMiddlewareFactory', ({ tenantContainer }) =>
				new TenantGraphQLMiddlewareFactory(tenantContainer.resolvers, tenantContainer.resolverContextFactory, logSentryError))
			.addService('systemGraphQLMiddlewareFactory', ({ systemContainer, debugMode }) =>
				new SystemGraphQLMiddlewareFactory(systemContainer.systemResolversFactory, systemContainer.resolverContextFactory, logSentryError, debugMode))
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
			.addService('httpErrorFactory', ({ debugMode }) =>
				new ErrorFactory(debugMode))
			.addService('authMiddlewareFactory', ({ tenantContainer, httpErrorFactory }) =>
				new AuthMiddlewareFactory(tenantContainer.apiKeyManager, httpErrorFactory))
			.addService('projectGroupMiddlewareFactory', ({ tenantContainer, httpErrorFactory }) =>
				new ProjectGroupMiddlewareFactory(config.server.projectGroup?.domainMapping, tenantContainer.projectGroupProvider, httpErrorFactory))
			.addService('projectResolverMiddlewareFactory', ({ projectContainerResolver, httpErrorFactory }) =>
				new ProjectResolveMiddlewareFactory(projectContainerResolver, httpErrorFactory))
			.addService('apiMiddlewareFactory', ({ projectGroupMiddlewareFactory, authMiddlewareFactory }) =>
				new ApiMiddlewareFactory(projectGroupMiddlewareFactory, authMiddlewareFactory))
			.addService('stageResolveMiddlewareFactory', ({ httpErrorFactory }) =>
				new StageResolveMiddlewareFactory(httpErrorFactory))
			.addService('notModifiedMiddlewareFactory', () =>
				new NotModifiedMiddlewareFactory())
			.addService('projectMemberMiddlewareFactory', ({ debugMode, tenantContainer, httpErrorFactory }) =>
				new ProjectMemberMiddlewareFactory(debugMode, tenantContainer.projectMemberManager, httpErrorFactory))
			.addService('contentServerMiddlewareFactory', () =>
				new ContentServerMiddlewareFactory())
			.addService(
				'koa',
				({
					 tenantGraphQlMiddlewareFactory,
					 systemGraphQLMiddlewareFactory,
					 apiMiddlewareFactory,
					 projectResolverMiddlewareFactory,
					 stageResolveMiddlewareFactory,
					 notModifiedMiddlewareFactory,
					 projectMemberMiddlewareFactory,
					 contentServerMiddlewareFactory,
					 promRegistry,
					 debugMode,
					 version,
					 config,
				 }) => {
					const app = new Koa()
					app.use(
						compose([
							koaCompress({
								br: false,
							}),
							bodyParser({
								jsonLimit: config.server.http.requestBodySize || '1mb',
							}),
							createPoweredByHeaderMiddleware(debugMode, version ?? 'unknown'),
							createColllectHttpMetricsMiddleware(promRegistry),
							createTimerMiddleware(),
							route('/playground$', createPlaygroundMiddleware()),
							createHomepageMiddleware(),
							route(
								'/content/:projectSlug/:stageSlug$',
								compose([
									apiMiddlewareFactory.create('content'),
									projectResolverMiddlewareFactory.create(),
									stageResolveMiddlewareFactory.create(),
									notModifiedMiddlewareFactory.create(),
									projectMemberMiddlewareFactory.create(),
									contentServerMiddlewareFactory.create(),
								]),
							),
							route(
								'/tenant$',
								compose([
									apiMiddlewareFactory.create('tenant'),
									tenantGraphQlMiddlewareFactory.create(),
								]),
							),
							route(
								'/system/:projectSlug$',
								compose([
									apiMiddlewareFactory.create('system'),
									projectResolverMiddlewareFactory.create(),
									projectMemberMiddlewareFactory.create(),
									systemGraphQLMiddlewareFactory.create(),
								]),
							),
						]),
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
				'initializer',
				({ tenantContainer, systemContainer, projectContainerResolver }) =>
					new Initializer(
						tenantContainer.migrationsRunnerFactory,
						tenantContainer.projectManager,
						systemContainer.projectInitializer,
						projectContainerResolver,
						tenantContainer.projectGroupProvider,
					),
			)
			.setupService('projectSchemaResolver', (it, { projectContainerResolver, schemaVersionBuilder }) => {
				it.setResolver(new ProjectSchemaResolver(projectContainerResolver, schemaVersionBuilder))
			})
			.setupService('projectInitializer', (it, { projectContainerResolver, systemContainer }) => {
				it.setInitializer(new ProjectInitializer(projectContainerResolver, systemContainer.projectInitializer))
			})
			.build()

		return masterContainer.pick('initializer', 'koa', 'monitoringKoa', 'projectContainerResolver', 'projectInitializer', 'providers')
	}
}

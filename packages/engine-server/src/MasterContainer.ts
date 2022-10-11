import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { ServerConfig } from './config/config'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import {
	compose,
	ContentApiMiddlewareFactory,
	ContentGraphQLContextFactory,
	ContentQueryHandlerFactory,
	ContentSchemaTransferMappingFactory,
	createHomepageMiddleware,
	createLoggerMiddleware,
	createModuleInfoMiddleware,
	createPlaygroundMiddleware,
	createPoweredByHeaderMiddleware,
	createProviders,
	createTimerMiddleware,
	ErrorMiddlewareFactory,
	ExportApiMiddlewareFactory,
	ExportExecutor,
	ImportApiMiddlewareFactory,
	ImportExecutor,
	Koa,
	NotModifiedChecker,
	ProjectGroupResolver as ProjectGroupResolverInterface,
	Providers,
	route,
	SystemApiMiddlewareFactory,
	SystemGraphQLContextFactory,
	SystemGraphQLHandlerFactory,
	SystemSchemaTransferMappingFactory,
	TenantApiMiddlewareFactory,
	TenantGraphQLContextFactory,
	TenantGraphQLHandlerFactory,
} from '@contember/engine-http'
import { ProjectContainerFactoryFactory } from './project'
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import { ProjectConfigResolver } from './config/projectConfigResolver'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'
import corsMiddleware from '@koa/cors'
import { ProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import { Logger } from '@contember/logger'
import { ExecutionContainerFactory, MapperContainerFactory } from '@contember/engine-content-api'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	providers: Providers
}

export interface MasterContainerArgs {
	debugMode: boolean
	serverConfig: ServerConfig
	projectConfigResolver: ProjectConfigResolver
	tenantConfigResolver: TenantConfigResolver
	plugins: Plugin[]
	logger: Logger
	version?: string
}

export class MasterContainerFactory {
	createBuilder({
		serverConfig,
		debugMode,
		plugins,
		projectConfigResolver,
		tenantConfigResolver,
		version,
		logger,
	}: MasterContainerArgs) {
		return new Builder({})
			.addService('serverConfig', () =>
				serverConfig)
			.addService('debugMode', () =>
				debugMode)
			.addService('version', () =>
				version)
			.addService('projectConfigResolver', () =>
				projectConfigResolver)
			.addService('tenantConfigResolver', () =>
				tenantConfigResolver)
			.addService('plugins', () =>
				plugins)
			.addService('providers', () =>
				createProviders())
			.addService('tenantContainerFactory', ({ providers }) =>
				new TenantContainerFactory(providers))
			.addService('modificationHandlerFactory', () =>
				new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
			.addService('systemContainerFactory', ({ providers, modificationHandlerFactory }) =>
				new SystemContainerFactory(providers, modificationHandlerFactory))
			.addService('projectContainerFactoryFactory', ({ debugMode, plugins, providers }) =>
				new ProjectContainerFactoryFactory(debugMode, plugins, providers))
			.addService('tenantGraphQLHandlerFactory', () =>
				new TenantGraphQLHandlerFactory())
			.addService('systemGraphQLHandlerFactory', ({ debugMode }) =>
				new SystemGraphQLHandlerFactory(debugMode))
			.addService('logger', () =>
				logger)
			.addService('projectGroupContainerFactory', ({ debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory, logger }) =>
				new ProjectGroupContainerFactory(debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory, logger))
			.addService('projectGroupContainer', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				projectGroupContainerFactory.create({ slug: undefined, config: tenantConfigResolver(undefined, {}) }))
			.addService('httpErrorMiddlewareFactory', ({ debugMode }) =>
				new ErrorMiddlewareFactory(debugMode))
			.addService('projectGroupResolver', ({ projectGroupContainer }): ProjectGroupResolverInterface =>
				new ProjectGroupResolver(projectGroupContainer))
			.addService('notModifiedChecker', () =>
				new NotModifiedChecker())
			.addService('mapperContainerFactory', ({ providers }) =>
				new MapperContainerFactory(providers))
			.addService('executionContainerFactory', ({ providers, mapperContainerFactory }) =>
				new ExecutionContainerFactory(providers, mapperContainerFactory))
			.addService('contentGraphqlContextFactory', ({ providers, executionContainerFactory }) =>
				new ContentGraphQLContextFactory(providers, executionContainerFactory))
			.addService('contentQueryHandlerFactory', ({ debugMode }) =>
				new ContentQueryHandlerFactory(debugMode))
			.addService('contentApiMiddlewareFactory', ({ projectGroupResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory }) =>
				new ContentApiMiddlewareFactory(projectGroupResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory))
			.addService('tenantGraphQLContextFactory', () =>
				new TenantGraphQLContextFactory())
			.addService('tenantApiMiddlewareFactory', ({ debugMode, projectGroupResolver, tenantGraphQLContextFactory }) =>
				new TenantApiMiddlewareFactory(debugMode, projectGroupResolver, tenantGraphQLContextFactory))
			.addService('systemGraphQLContextFactory', () =>
				new SystemGraphQLContextFactory())
			.addService('systemApiMiddlewareFactory', ({ debugMode, projectGroupResolver, systemGraphQLContextFactory }) =>
				new SystemApiMiddlewareFactory(debugMode, projectGroupResolver, systemGraphQLContextFactory))
			.addService('contentSchemaTransferMappingFactory', () =>
				new ContentSchemaTransferMappingFactory())
			.addService('systemSchemaTransferMappingFactory', () =>
				new SystemSchemaTransferMappingFactory())
			.addService('importExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory }) =>
				new ImportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory))
			.addService('exportExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory }) =>
				new ExportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory))
			.addService('importApiMiddlewareFactory', ({ projectGroupResolver, importExecutor }) =>
				new ImportApiMiddlewareFactory(projectGroupResolver, importExecutor))
			.addService('exportApiMiddlewareFactory', ({ projectGroupResolver, exportExecutor }) =>
				new ExportApiMiddlewareFactory(projectGroupResolver, exportExecutor))
			.addService('koaMiddlewares', ({ contentApiMiddlewareFactory, tenantApiMiddlewareFactory, systemApiMiddlewareFactory, importApiMiddlewareFactory, exportApiMiddlewareFactory, httpErrorMiddlewareFactory, debugMode, version, serverConfig, logger }) =>
				compose([
					koaCompress({
						br: false,
					}),
					bodyParser({
						jsonLimit: serverConfig.http.requestBodySize || '1mb',
					}),
					createPoweredByHeaderMiddleware(debugMode, version ?? 'unknown'),
					createLoggerMiddleware(logger),
					createTimerMiddleware({ debugMode }),
					httpErrorMiddlewareFactory.create(),
					route('/playground$', createPlaygroundMiddleware()),
					createHomepageMiddleware(),
					corsMiddleware(),
					route(
						'/content/:projectSlug/:stageSlug$',
						compose([
							createModuleInfoMiddleware('content'),
							contentApiMiddlewareFactory.create(),
						]),
					),
					route(
						'/tenant$',
						compose([
							createModuleInfoMiddleware('tenant'),
							tenantApiMiddlewareFactory.create(),
						]),
					),
					route(
						'/system/:projectSlug$',
						compose([
							createModuleInfoMiddleware('system'),
							systemApiMiddlewareFactory.create(),
						]),
					),
					route(
						'/import$',
						compose([
							createModuleInfoMiddleware('transfer'),
							importApiMiddlewareFactory.create(),
						]),
					),
					route(
						'/export$',
						compose([
							createModuleInfoMiddleware('transfer'),
							exportApiMiddlewareFactory.create(),
						]),
					),
				]))
			.addService('koa', ({ koaMiddlewares }) => {
				const app = new Koa()
				app.use(koaMiddlewares)

				return app
			})
			.addService('initializer', ({ projectGroupContainer }) =>
				new Initializer(projectGroupContainer))
			.setupService('mapperContainerFactory', (it, { plugins }) => {
				for (const plugin of plugins) {
					if (plugin.getMapperContainerHook) {
						it.hooks.push(plugin.getMapperContainerHook())
					}
				}
			})

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'koa', 'providers')
	}
}

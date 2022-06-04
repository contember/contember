import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { ServerConfig } from './config/config'
import { logSentryError } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import {
	compose,
	ContentApiMiddlewareFactory,
	ContentImporter,
	ContentExporter,
	ContentGraphQLContextFactory,
	ContentQueryHandlerFactory,
	createHomepageMiddleware,
	createModuleInfoMiddleware,
	createPlaygroundMiddleware,
	createPoweredByHeaderMiddleware,
	createProviders,
	createTimerMiddleware,
	ErrorMiddlewareFactory,
	Koa,
	NotModifiedChecker,
	Providers,
	route,
	SystemApiMiddlewareFactory,
	SystemGraphQLContextFactory,
	SystemGraphQLHandlerFactory,
	TenantApiMiddlewareFactory,
	TenantGraphQLContextFactory,
	TenantGraphQLHandlerFactory,
	TransferApiMiddlewareFactory,
} from '@contember/engine-http'
import { ProjectContainerFactoryFactory } from './project'
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import { ProjectConfigResolver } from './config/projectConfigResolver'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'
import corsMiddleware from '@koa/cors'
import { ProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import { ProjectGroupContainer, ProjectGroupResolver as ProjectGroupResolverInterface } from '@contember/engine-http'

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
				new TenantGraphQLHandlerFactory(logSentryError))
			.addService('systemGraphQLHandlerFactory', ({ debugMode }) =>
				new SystemGraphQLHandlerFactory(logSentryError, debugMode))
			.addService('projectGroupContainerFactory', ({ debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory }) =>
				new ProjectGroupContainerFactory(debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory))
			.addService('projectGroupContainer', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				projectGroupContainerFactory.create({ slug: undefined, config: tenantConfigResolver(undefined, {}) }))
			.addService('httpErrorMiddlewareFactory', ({ debugMode }) =>
				new ErrorMiddlewareFactory(debugMode))
			.addService('projectGroupResolver', ({ projectGroupContainer }): ProjectGroupResolverInterface =>
				new ProjectGroupResolver(projectGroupContainer))
			.addService('notModifiedChecker', () =>
				new NotModifiedChecker())
			.addService('contentGraphqlContextFactory', ({ providers }) =>
				new ContentGraphQLContextFactory(providers))
			.addService('contentQueryHandlerFactory', ({ debugMode }) =>
				new ContentQueryHandlerFactory(debugMode, logSentryError))
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
			.addService('contentImporter', () =>
				new ContentImporter())
			.addService('contentExporter', () =>
				new ContentExporter())
			.addService('transferApiMiddlewareFactory', ({ debugMode, projectGroupResolver, contentImporter, contentExporter }) =>
				new TransferApiMiddlewareFactory(debugMode, projectGroupResolver, contentImporter, contentExporter))
			.addService('koaMiddlewares', ({ contentApiMiddlewareFactory, tenantApiMiddlewareFactory, systemApiMiddlewareFactory, transferApiMiddlewareFactory, httpErrorMiddlewareFactory, debugMode, version, serverConfig }) =>
				compose([
					koaCompress({
						br: false,
					}),
					bodyParser({
						jsonLimit: serverConfig.http.requestBodySize || '1mb',
					}),
					createPoweredByHeaderMiddleware(debugMode, version ?? 'unknown'),
					httpErrorMiddlewareFactory.create(),
					createTimerMiddleware(),
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
						'/export/:projectSlug/:stageSlug$',
						compose([
							createModuleInfoMiddleware('transfer'),
							transferApiMiddlewareFactory.create('export'),
						]),
					),
					route(
						'/import/:projectSlug/:stageSlug$',
						compose([
							createModuleInfoMiddleware('transfer'),
							transferApiMiddlewareFactory.create('import'),
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

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'koa', 'providers')
	}
}

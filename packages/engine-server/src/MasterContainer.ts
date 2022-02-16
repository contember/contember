import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { Config } from './config/config'
import { createDbMetricsRegistrar, logSentryError, ProcessType } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './http'
import {
	compose,
	ContentApiMiddlewareFactory,
	ContentGraphQLContextFactory,
	ContentQueryHandlerFactory,
	createHomepageMiddleware,
	createModuleInfoMiddleware,
	createPlaygroundMiddleware,
	createPoweredByHeaderMiddleware,
	createProviders,
	createTimerMiddleware,
	CryptoWrapper,
	ErrorMiddlewareFactory,
	Koa,
	NotModifiedChecker,
	ProjectGroupResolver,
	Providers,
	route, SystemApiMiddlewareFactory, SystemGraphQLContextFactory,
	SystemGraphQLHandlerFactory, TenantApiMiddlewareFactory, TenantGraphQLContextFactory,
	TenantGraphQLHandlerFactory,
} from '@contember/engine-http'
import prom from 'prom-client'
import { ProjectContainerFactoryFactory } from './project'
import { createSecretKey } from 'crypto'
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import { ProjectConfigResolver } from './config/projectConfigResolver'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'
import corsMiddleware from '@koa/cors'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	monitoringKoa: Koa
	providers: Providers
}

export interface MasterContainerArgs {
	debugMode: boolean
	config: Config
	projectConfigResolver: ProjectConfigResolver
	tenantConfigResolver: TenantConfigResolver
	plugins: Plugin[]
	processType: ProcessType
	version?: string
}

export class MasterContainerFactory {
	createBuilder({
		config,
		debugMode,
		plugins,
		projectConfigResolver,
		tenantConfigResolver,
		processType,
		version,
	}: MasterContainerArgs) {
		return new Builder({})
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
			.addService('projectGroupContainerFactory', ({ providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory }) =>
				new ProjectGroupContainerFactory(providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory))
			.addService('projectGroupContainerResolver', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				new ProjectGroupContainerResolver(tenantConfigResolver, projectGroupContainerFactory))
			.addService('promRegistry', ({ processType, projectGroupContainerResolver }) => {
				if (processType === ProcessType.clusterMaster) {
					const register = new prom.AggregatorRegistry()
					prom.collectDefaultMetrics({ register })
					return register
				}
				const register = prom.register
				prom.collectDefaultMetrics({ register })
				const registrar = createDbMetricsRegistrar(register)
				projectGroupContainerResolver.onCreate.push((groupContainer, slug) => {
					groupContainer.projectContainerResolver.onCreate.push(projectContainer =>
						registrar({
							connection: projectContainer.connection,
							labels: {
								contember_module: 'content',
								contember_project: projectContainer.project.slug,
								contember_project_group: slug ?? 'unknown',
							},
						}),
					)
					return registrar({
						connection: groupContainer.tenantContainer.connection,
						labels: {
							contember_module: 'tenant',
							contember_project_group: slug ?? 'unknown',
							contember_project: 'unknown',
						},
					})
				})
				return register
			})
			.addService('httpErrorMiddlewareFactory', ({ debugMode }) =>
				new ErrorMiddlewareFactory(debugMode))
			.addService('projectGroupResolver', ({ projectGroupContainerResolver }) => {
				const encryptionKey = config.server.projectGroup?.configEncryptionKey
					? createSecretKey(Buffer.from(config.server.projectGroup?.configEncryptionKey, 'hex'))
					: undefined
				return new ProjectGroupResolver(
					config.server.projectGroup?.domainMapping,
					config.server.projectGroup?.configHeader,
					config.server.projectGroup?.configEncryptionKey ? new CryptoWrapper(encryptionKey) : undefined,
					projectGroupContainerResolver,
				)
			})
			.addService('notModifiedChecker', () =>
				new NotModifiedChecker())
			.addService('contentGraphqlContextFactory', ({ providers }) =>
				new ContentGraphQLContextFactory(providers))
			.addService('contentQueryHandlerFactory', ({ debugMode }) =>
				new ContentQueryHandlerFactory(debugMode, logSentryError))
			.addService('contentApiMiddlewareFactory', ({ debugMode, projectGroupResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory }) =>
				new ContentApiMiddlewareFactory(debugMode, projectGroupResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory))
			.addService('tenantGraphQLContextFactory', () =>
				new TenantGraphQLContextFactory())
			.addService('tenantApiMiddlewareFactory', ({ debugMode, projectGroupResolver, tenantGraphQLContextFactory }) =>
				new TenantApiMiddlewareFactory(debugMode, projectGroupResolver, tenantGraphQLContextFactory))
			.addService('systemGraphQLContextFactory', () =>
				new SystemGraphQLContextFactory())
			.addService('systemApiMiddlewareFactory', ({ debugMode, projectGroupResolver, systemGraphQLContextFactory }) =>
				new SystemApiMiddlewareFactory(debugMode, projectGroupResolver, systemGraphQLContextFactory))
			.addService('koa', ({ contentApiMiddlewareFactory, tenantApiMiddlewareFactory, systemApiMiddlewareFactory, httpErrorMiddlewareFactory, promRegistry, debugMode, version, config }) => {
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
						httpErrorMiddlewareFactory.create(),
						createColllectHttpMetricsMiddleware(promRegistry),
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
					]),
				)

				return app
			})
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})
			.addService('initializer', ({ projectGroupContainerResolver }) =>
				new Initializer(projectGroupContainerResolver))

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'koa', 'monitoringKoa', 'providers')
	}
}

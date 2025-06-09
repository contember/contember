import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { ServerConfig } from './config/config'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'

import { ProjectContainerFactoryFactory } from './project'
import { ProjectConfigResolver } from './config/projectConfigResolver'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'
import { ProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import { Logger } from '@contember/logger'
import { ExecutionContainerFactory, GraphQlSchemaBuilderFactory, PermissionFactory } from '@contember/engine-content-api'
import { createProviders, Providers } from './providers'
import { TenantApiMiddlewareFactory, TenantGraphQLContextFactory, TenantGraphQLHandlerFactory } from './tenant'
import { SystemApiMiddlewareFactory, SystemGraphQLContextFactory, SystemGraphQLHandlerFactory } from './system'
import {
	ContentApiControllerFactory, ContentGraphQLContextFactory, ContentQueryHandlerFactory, GraphQLSchemaContributor, GraphQlSchemaFactory,
	GraphQLSchemaFactoryResult, NotModifiedChecker,
} from './content'
import { ProjectContextResolver } from './project-common'
import {
	ContentSchemaTransferMappingFactory,
	ExportApiControllerFactory,
	ExportExecutor,
	ImportApiMiddlewareFactory,
	ImportExecutor,
	SystemSchemaTransferMappingFactory,
} from './transfer'
import { homepageController } from './misc'
import { Plugin } from './plugin/Plugin'
import { Application } from './application'
import { ApplicationWorkerManager } from './workers'
import { HttpResponse } from './common'
import { ContentQueryExecutorImpl } from './system/ContentQueryExecutor'
import { DatabaseMetadataResolver } from '@contember/database'
import Koa from 'koa'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { PrometheusRegistryFactory } from './prometheus/PrometheusRegistryFactory'
import { ProjectGroupContainerMetricsHook } from './prometheus/ProjectGroupContainerMetricsHook'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './prometheus'
import { createSecretKey } from 'node:crypto'
import { CryptoWrapper } from './utils/CryptoWrapper'
import { ContentApiSpecificCache } from './content/ContentApiSpecificCache'
import { Schema } from '@contember/schema'

export type ProcessType =
	| 'singleNode'
	| 'clusterMaster'
	| 'clusterWorker'

export interface MasterContainer {
	initializer: Initializer
	application: Application
	providers: Providers
	applicationWorkers: ApplicationWorkerManager
	monitoringKoa: Koa
}

export interface MasterContainerArgs {
	debugMode: boolean
	serverConfig: ServerConfig
	projectConfigResolver: ProjectConfigResolver
	tenantConfigResolver: TenantConfigResolver
	plugins: Plugin[]
	logger: Logger
	version?: string
	processType: ProcessType
}

export type MasterContainerBuilder = ReturnType<MasterContainerFactory['createBuilderInternal']>
export type MasterContainerHook = (builder: MasterContainerBuilder) => MasterContainerBuilder

export class MasterContainerFactory {

	createBuilder(args: MasterContainerArgs): MasterContainerBuilder {
		const builder = this.createBuilderInternal(args)
		const hooks = args.plugins
			.map(it => it.getMasterContainerHook?.())
			.filter((it): it is MasterContainerHook => it !== undefined)
		return hooks.reduce((acc, cb) => cb(acc), builder)
	}

	createBuilderInternal({
		serverConfig,
		debugMode,
		plugins,
		projectConfigResolver,
		tenantConfigResolver,
		version,
		logger,
		processType,
	}: MasterContainerArgs) {
		return new Builder({})
			.addService('serverConfig', () =>
				serverConfig)
			.addService('debugMode', () =>
				debugMode)
			.addService('version', () =>
				version)
			.addService('processType', () =>
				processType)
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
			.addService('executionContainerFactory', ({ providers, serverConfig }) =>
				new ExecutionContainerFactory(providers, serverConfig.contentApi?.whereOptimizer))
			.addService('graphQlSchemaBuilderFactory', () =>
				new GraphQlSchemaBuilderFactory())
			.addService('contentQueryExecutor', ({ executionContainerFactory, graphQlSchemaBuilderFactory }) =>
				new ContentQueryExecutorImpl(executionContainerFactory, graphQlSchemaBuilderFactory))
			.addService('systemContainerFactory', ({ providers, modificationHandlerFactory, contentQueryExecutor }) =>
				new SystemContainerFactory(providers, modificationHandlerFactory, contentQueryExecutor))
			.addService('contentPermissionFactory', ({}) =>
				new PermissionFactory())
			.addService('databaseMetadataResolver', () =>
				new DatabaseMetadataResolver())
			.addService('graphqlSchemaCache', ({ serverConfig }) =>
				new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({
					ttlSeconds: serverConfig.contentApi?.schemaCacheTtlSeconds,
				}))
			.addService('graphQlSchemaFactory', ({ plugins, providers, graphqlSchemaCache, contentPermissionFactory, graphQlSchemaBuilderFactory }) => {
				const contributors = plugins
					.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ providers }) : null))
					.filter((it): it is GraphQLSchemaContributor => !!it)

				return new GraphQlSchemaFactory(
					graphqlSchemaCache,
					graphQlSchemaBuilderFactory,
					contentPermissionFactory,
					contributors,
				)
			})
			.addService('projectContainerFactoryFactory', ({ plugins, providers, databaseMetadataResolver }) =>
				new ProjectContainerFactoryFactory(plugins, providers, databaseMetadataResolver))
			.addService('tenantGraphQLHandlerFactory', () =>
				new TenantGraphQLHandlerFactory())
			.addService('systemGraphQLHandlerFactory', ({ debugMode }) =>
				new SystemGraphQLHandlerFactory(debugMode))
			.addService('logger', () =>
				logger)
			.addService('projectGroupContainerFactory', ({ debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory, logger }) =>
				new ProjectGroupContainerFactory(debugMode, providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory, logger))
			.addService('projectGroupContainerResolver', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				new ProjectGroupContainerResolver(tenantConfigResolver, projectGroupContainerFactory))
			.addService('promRegistryFactory', ({ processType, version }) =>
				new PrometheusRegistryFactory(processType, { version }))
			.addService('projectGroupContainerMetricsHook', ({ projectGroupContainerResolver }) =>
				new ProjectGroupContainerMetricsHook(projectGroupContainerResolver))
			.addService('promRegistry', ({ promRegistryFactory, projectGroupContainerMetricsHook }) => {
				const registry = promRegistryFactory.create()
				projectGroupContainerMetricsHook.register(registry)
				return registry
			})
			.addService('projectGroupContainer', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				projectGroupContainerFactory.create({ slug: undefined, config: tenantConfigResolver(undefined, {}) }))
			.addService('projectGroupResolver', ({ serverConfig, projectGroupContainerResolver }): ProjectGroupResolver => {
				const encryptionKey = serverConfig.projectGroup?.configEncryptionKey
					? createSecretKey(Buffer.from(serverConfig.projectGroup?.configEncryptionKey, 'hex'))
					: undefined
				return new ProjectGroupResolver(
					serverConfig.projectGroup?.domainMapping,
					serverConfig.projectGroup?.configHeader,
					serverConfig.projectGroup?.configEncryptionKey ? new CryptoWrapper(encryptionKey) : undefined,
					projectGroupContainerResolver,
				)

			})
			.addService('notModifiedChecker', () =>
				new NotModifiedChecker())
			.addService('contentGraphqlContextFactory', ({ providers, executionContainerFactory }) =>
				new ContentGraphQLContextFactory(providers, executionContainerFactory))
			.addService('contentQueryHandlerFactory', ({ debugMode }) =>
				new ContentQueryHandlerFactory(debugMode))
			.addService('projectContextResolver', () =>
				new ProjectContextResolver())
			.addService('contentApiMiddlewareFactory', ({ projectContextResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory, graphQlSchemaFactory }) =>
				new ContentApiControllerFactory(notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory, projectContextResolver, graphQlSchemaFactory))
			.addService('tenantGraphQLContextFactory', () =>
				new TenantGraphQLContextFactory())
			.addService('tenantApiMiddlewareFactory', ({ debugMode, projectGroupResolver, tenantGraphQLContextFactory }) =>
				new TenantApiMiddlewareFactory(debugMode, projectGroupResolver, tenantGraphQLContextFactory))
			.addService('systemGraphQLContextFactory', () =>
				new SystemGraphQLContextFactory())
			.addService('systemApiMiddlewareFactory', ({ debugMode, systemGraphQLContextFactory, projectContextResolver }) =>
				new SystemApiMiddlewareFactory(debugMode, systemGraphQLContextFactory, projectContextResolver))
			.addService('contentSchemaTransferMappingFactory', () =>
				new ContentSchemaTransferMappingFactory())
			.addService('systemSchemaTransferMappingFactory', () =>
				new SystemSchemaTransferMappingFactory())
			.addService('importExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory, databaseMetadataResolver }) =>
				new ImportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory, databaseMetadataResolver))
			.addService('exportExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory }) =>
				new ExportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory))
			.addService('importApiMiddlewareFactory', ({ projectGroupResolver, importExecutor }) =>
				new ImportApiMiddlewareFactory(projectGroupResolver, importExecutor))
			.addService('exportApiMiddlewareFactory', ({ projectGroupResolver, exportExecutor }) =>
				new ExportApiControllerFactory(projectGroupResolver, exportExecutor))
			.addService('application', ({ projectGroupResolver, serverConfig, logger, debugMode, version, promRegistry }) => {
				const app = new Application(
					projectGroupResolver,
					serverConfig,
					debugMode,
					version,
					logger,
				)
				app.addMiddleware(createColllectHttpMetricsMiddleware(promRegistry))

				return app
			})
			.setupService('application', (it, { contentApiMiddlewareFactory, tenantApiMiddlewareFactory, systemApiMiddlewareFactory, importApiMiddlewareFactory, exportApiMiddlewareFactory }) => {
				it.addRoute('content', '/content/:projectSlug/:stageSlug', contentApiMiddlewareFactory.create())
				it.addRoute('tenant', '/tenant', tenantApiMiddlewareFactory.create())
				it.addRoute('system', '/system/:projectSlug', systemApiMiddlewareFactory.create())
				it.addRoute('transfer', '/import', importApiMiddlewareFactory.create())
				it.addRoute('transfer', '/export', exportApiMiddlewareFactory.create())
				it.addRoute('misc', '/', homepageController)

				it.addInternalRoute('internal', '/health', () => {
					return new HttpResponse(200, 'OK')
				})
			})
			.addService('initializer', ({ projectGroupContainer }) =>
				new Initializer(projectGroupContainer))
			.addService('applicationWorkers', () =>
				new ApplicationWorkerManager())
			.setupService('executionContainerFactory', (it, { plugins }) => {
				for (const plugin of plugins) {
					if (plugin.getExecutionContainerHook) {
						it.hooks.push(plugin.getExecutionContainerHook())
					}
				}
			})
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'application', 'providers', 'applicationWorkers', 'monitoringKoa')
	}
}

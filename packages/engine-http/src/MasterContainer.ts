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
import { ProjectGroupResolver, SingleProjectGroupResolver } from './projectGroup/ProjectGroupResolver'
import { Logger } from '@contember/logger'
import { ExecutionContainerFactory } from '@contember/engine-content-api'
import { createProviders, Providers } from './providers'
import { TenantApiMiddlewareFactory, TenantGraphQLContextFactory, TenantGraphQLHandlerFactory } from './tenant'
import { SystemApiMiddlewareFactory, SystemGraphQLContextFactory, SystemGraphQLHandlerFactory } from './system'
import {
	ContentApiControllerFactory,
	ContentGraphQLContextFactory,
	ContentQueryHandlerFactory,
	NotModifiedChecker,
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
import { homepageController, playgroundController } from './misc'
import { Plugin } from './plugin/Plugin'
import { Application } from './application/application'

export interface MasterContainer {
	initializer: Initializer
	application: Application
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
			.addService('projectGroupResolver', ({ projectGroupContainer }): ProjectGroupResolver =>
				new SingleProjectGroupResolver(projectGroupContainer))
			.addService('notModifiedChecker', () =>
				new NotModifiedChecker())
			.addService('executionContainerFactory', ({ providers }) =>
				new ExecutionContainerFactory(providers))
			.addService('contentGraphqlContextFactory', ({ providers, executionContainerFactory }) =>
				new ContentGraphQLContextFactory(providers, executionContainerFactory))
			.addService('contentQueryHandlerFactory', ({ debugMode }) =>
				new ContentQueryHandlerFactory(debugMode))
			.addService('projectContextResolver', () =>
				new ProjectContextResolver())
			.addService('contentApiMiddlewareFactory', ({ projectContextResolver, notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory }) =>
				new ContentApiControllerFactory(notModifiedChecker, contentGraphqlContextFactory, contentQueryHandlerFactory, projectContextResolver))
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
			.addService('importExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory }) =>
				new ImportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory))
			.addService('exportExecutor', ({ contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory }) =>
				new ExportExecutor(contentSchemaTransferMappingFactory, systemSchemaTransferMappingFactory))
			.addService('importApiMiddlewareFactory', ({ projectGroupResolver, importExecutor }) =>
				new ImportApiMiddlewareFactory(projectGroupResolver, importExecutor))
			.addService('exportApiMiddlewareFactory', ({ projectGroupResolver, exportExecutor }) =>
				new ExportApiControllerFactory(projectGroupResolver, exportExecutor))
			.addService('application', ({ projectGroupResolver, serverConfig, logger, debugMode, version }) => {
				const app = new Application(
					projectGroupResolver,
					serverConfig,
					debugMode,
					version,
					logger,
				)

				return app
			})
			.setupService('application', (it, { contentApiMiddlewareFactory, tenantApiMiddlewareFactory, systemApiMiddlewareFactory, importApiMiddlewareFactory, exportApiMiddlewareFactory }) => {
				it.addRoute('content', '/content/:projectSlug/:stageSlug', contentApiMiddlewareFactory.create())
				it.addRoute('tenant', '/tenant', tenantApiMiddlewareFactory.create())
				it.addRoute('system', '/system/:projectSlug', systemApiMiddlewareFactory.create())
				it.addRoute('transfer', '/import', importApiMiddlewareFactory.create())
				it.addRoute('transfer', '/export', exportApiMiddlewareFactory.create())
				it.addRoute('misc', '/playground', playgroundController)
				it.addRoute('misc', '/', homepageController)
			})
			.addService('initializer', ({ projectGroupContainer }) =>
				new Initializer(projectGroupContainer))
			.setupService('executionContainerFactory', (it, { plugins }) => {
				for (const plugin of plugins) {
					if (plugin.getExecutionContainerHook) {
						it.hooks.push(plugin.getExecutionContainerHook())
					}
				}
			})

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'application', 'providers')
	}
}

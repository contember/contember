import {
	ContentApplyDependenciesFactoryImpl,
	ContentEventApplier,
	createMapperContainer,
	EntitiesSelector,
	EntitiesSelectorMapperFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { SchemaVersionBuilder, SystemContainerFactory } from '@contember/engine-system-api'
import {
	getTenantMigrationsDirectory,
	ProjectSchemaResolver,
	Providers as TenantProviders,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { Config, Project, TenantConfig } from './config/config'
import { logSentryError, tuple } from './utils'
import { MigrationFilesManager, MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer, ServerRunner } from './bootstrap'
import { createProjectContainer } from './ProjectContainer'
import { Plugin } from '@contember/engine-plugins'
import { MigrationsRunner } from '@contember/database-migrations'
import { createRootMiddleware } from './http/RootMiddleware'
import {
	Koa,
	ProjectContainer,
	ProjectContainerResolver,
	providers,
	SystemServerProvider,
	TenantApolloServerFactory,
} from '@contember/engine-http'
import prom from 'prom-client'
import { createShowMetricsMiddleware } from './http'
import { registerDbMetrics, registerDbPoolCollector } from './utils/dbMetrics'

export interface MasterContainer {
	initializer: Initializer
	serverRunner: ServerRunner
	koa: Koa
}

class CompositionRoot {
	createMasterContainer(debug: boolean, config: Config, projectsDirectory: string, plugins: Plugin[]): MasterContainer {
		let projectSchemaResolverInner: ProjectSchemaResolver = () => {
			throw new Error('called too soon')
		}
		const projectSchemaResolver: ProjectSchemaResolver = slug => projectSchemaResolverInner(slug)

		const tenantContainer = this.createTenantContainer(config.tenant, providers, projectSchemaResolver)

		const systemContainerDependencies = new Builder({})
			.addService('providers', () => providers)
			.addService('migrationsResolverFactory', () => (project: Pick<Project, 'slug' | 'directory'>) =>
				new MigrationsResolver(
					MigrationFilesManager.createForProject(projectsDirectory, project.directory || project.slug),
				),
			)
			.addService(
				'modificationHandlerFactory',
				() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
			)
			.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
			.addService('entitiesSelector', ({ permissionsByIdentityFactory }) => {
				const mapperFactory: EntitiesSelectorMapperFactory = (db, schema, identityVariables, permissions) =>
					createMapperContainer({
						schema,
						identityVariables,
						permissions,
						providers,
					}).mapperFactory(db)
				return new EntitiesSelector(mapperFactory, permissionsByIdentityFactory)
			})
			.addService('identityFetcher', () => tenantContainer.identityFetcher)
			.addService('eventApplier', () => {
				return new ContentEventApplier(new ContentApplyDependenciesFactoryImpl())
			})
			.build()
		const systemContainer = new SystemContainerFactory().create(systemContainerDependencies)

		const projectContainers = this.createProjectContainers(
			debug,
			Object.values(config.projects),
			plugins,
			systemContainer.schemaVersionBuilder,
		)

		const containerList = Object.values(projectContainers)
		const projectContainerResolver: ProjectContainerResolver = (slug, aliasFallback = false) =>
			Promise.resolve(
				projectContainers[slug] ||
					(aliasFallback
						? containerList.find(function(it) {
								return it.project.alias && it.project.alias.includes(slug)
						  })
						: undefined),
			)

		projectSchemaResolverInner = async slug => {
			const container = await projectContainerResolver(slug)
			if (!container) {
				return undefined
			}
			const db = container.systemDatabaseContextFactory.create(undefined)
			return await systemContainer.schemaVersionBuilder.buildSchema(db)
		}

		const masterContainer = new Builder({})
			.addService('providers', () => providers)
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainerResolver', () => projectContainerResolver)

			.addService('tenantApolloServer', ({ tenantContainer }) =>
				new TenantApolloServerFactory(
					tenantContainer.resolvers,
					tenantContainer.resolverContextFactory,
					logSentryError,
				).create(),
			)
			.addService(
				'systemServerProvider',
				() =>
					new SystemServerProvider(
						systemContainer.systemResolvers,
						systemContainer.resolverContextFactory,
						logSentryError,
					),
			)

			.addService('promRegistry', () => {
				const registry = new prom.Registry()
				prom.collectDefaultMetrics({ register: registry })
				registerDbMetrics(registry, tenantContainer.connection, containerList)
				return registry
			})
			.addService(
				'koa',
				({
					tenantApolloServer,
					projectContainerResolver,
					tenantContainer,
					providers,
					systemServerProvider,
					promRegistry,
				}) => {
					const app = new Koa()
					app.use(
						createRootMiddleware(
							debug,
							{
								tenantApolloServer,
								projectContainerResolver,
								apiKeyManager: tenantContainer.apiKeyManager,
								projectMemberManager: tenantContainer.projectMemberManager,
								providers,
								systemServerProvider,
							},
							promRegistry,
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
				() => new MigrationsRunner(config.tenant.db, 'tenant', getTenantMigrationsDirectory()),
			)
			.addService(
				'initializer',
				({ tenantMigrationsRunner }) =>
					new Initializer(
						tenantMigrationsRunner,
						tenantContainer.projectManager,
						systemContainer.projectInitializer,
						containerList,
					),
			)
			.addService('serverRunner', ({ koa, monitoringKoa }) => new ServerRunner(koa, monitoringKoa, config))

			.build()

		return masterContainer.pick('initializer', 'serverRunner', 'koa')
	}

	createProjectContainers(
		debug: boolean,
		projects: Array<Project>,
		plugins: Plugin[],
		schemaVersionBuilder: SchemaVersionBuilder,
	): Record<string, ProjectContainer> {
		const containers = Object.values(projects).map((project: Project): [string, ProjectContainer] => {
			const projectContainer = createProjectContainer(debug, project, plugins, schemaVersionBuilder)
			return tuple(project.slug, projectContainer)
		})
		return Object.fromEntries(containers)
	}

	createTenantContainer(
		tenantConfig: TenantConfig,
		providers: TenantProviders,
		projectSchemaResolver: ProjectSchemaResolver,
	) {
		return new TenantContainer.Factory().create(tenantConfig.db, tenantConfig.mailer, providers, projectSchemaResolver)
	}
}

export default CompositionRoot

import Koa from 'koa'
import { Connection } from '@contember/database'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import {
	getSystemMigrationsDirectory,
	MigrationsResolver,
	SchemaMigrator,
	SchemaVersionBuilder,
	SystemContainerFactory,
} from '@contember/engine-system-api'
import {
	MigrationFilesManager,
	ModificationHandlerFactory,
	SchemaVersionBuilder as SchemaVersionBuilderInternal,
} from '@contember/schema-migrations'
import {
	getTenantMigrationsDirectory,
	Providers as TenantProviders,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { Schema } from '@contember/schema'
import { Builder, mergeContainers } from '@contember/dic'
import {
	AuthMiddlewareFactory,
	ContentApolloMiddlewareFactory,
	ContentApolloServerFactory,
	ContentMiddlewareFactory,
	DatabaseTransactionMiddlewareFactory,
	GraphQlSchemaFactory,
	HomepageMiddlewareFactory,
	MiddlewareStackFactory,
	NotModifiedMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
	SetupSystemVariablesMiddlewareFactory,
	StageResolveMiddlewareFactory,
	SystemApolloServerFactory,
	SystemMiddlewareFactory,
	TenantApolloServerFactory,
	TenantMiddlewareFactory,
	TimerMiddlewareFactory,
} from './http'
import { Config, Project, TenantConfig } from './config/config'
import { providers } from './utils/providers'
import { graphqlObjectFactories } from './utils/graphqlObjectFactories'
import { projectVariablesResolver } from './utils/projectVariablesProvider'
import { Initializer, ServerRunner } from './bootstrap'
import { ProjectContainer, ProjectContainerResolver } from './ProjectContainer'
import { ErrorResponseMiddlewareFactory } from './http/ErrorResponseMiddlewareFactory'
import { tuple } from './utils'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import { ExecutedMigrationsResolver } from '@contember/engine-system-api/dist/src/model/migrations/ExecutedMigrationsResolver'
import { MigrationsRunner } from '@contember/database-migrations'

export interface MasterContainer {
	initializer: Initializer
	serverRunner: ServerRunner
	koa: Koa
}

class CompositionRoot {
	createMasterContainer(
		debug: boolean,
		config: Config,
		projectsDirectory: string,
		projectSchemas: undefined | { [name: string]: Schema },
		plugins: Plugin[],
	): MasterContainer {
		const projectContainers = this.createProjectContainers(
			debug,
			Object.values(config.projects),
			projectsDirectory,
			projectSchemas,
			plugins,
		)

		const containerList = Object.values(projectContainers)
		const projectContainerResolver: ProjectContainerResolver = (slug, aliasFallback = false) =>
			projectContainers[slug] ||
			(aliasFallback
				? containerList.find(function(it) {
						return it.project.alias && it.project.alias.includes(slug)
				  })
				: undefined)

		const tenantContainer = this.createTenantContainer(config.tenant, providers, projectContainerResolver)

		const masterContainer = new Builder({})
			.addService('providers', () => providers)
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainerResolver', () => projectContainerResolver)

			.addService('homepageMiddlewareFactory', () => new HomepageMiddlewareFactory())

			.addService(
				'authMiddlewareFactory',
				({ tenantContainer }) => new AuthMiddlewareFactory(tenantContainer.apiKeyManager),
			)
			.addService(
				'projectMemberMiddlewareFactory',
				({ tenantContainer }) => new ProjectMemberMiddlewareFactory(tenantContainer.projectMemberManager),
			)
			.addService(
				'projectResolveMiddlewareFactory',
				({ projectContainerResolver }) => new ProjectResolveMiddlewareFactory(projectContainerResolver),
			)
			.addService('stageResolveMiddlewareFactory', () => new StageResolveMiddlewareFactory())
			.addService('databaseTransactionMiddlewareFactory', () => {
				return new DatabaseTransactionMiddlewareFactory()
			})
			.addService('tenantApolloServer', ({ tenantContainer }) =>
				new TenantApolloServerFactory(tenantContainer.resolvers, tenantContainer.resolverContextFactory).create(),
			)
			.addService(
				'tenantMiddlewareFactory',
				({ tenantApolloServer, authMiddlewareFactory }) =>
					new TenantMiddlewareFactory(tenantApolloServer, authMiddlewareFactory),
			)
			.addService(
				'setupSystemVariablesMiddlewareFactory',
				({ providers }) => new SetupSystemVariablesMiddlewareFactory(providers),
			)
			.addService('notModifiedMiddlewareFactory', () => new NotModifiedMiddlewareFactory())
			.addService(
				'contentMiddlewareFactory',
				({
					authMiddlewareFactory,
					projectMemberMiddlewareFactory,
					projectResolveMiddlewareFactory,
					stageResolveMiddlewareFactory,
					notModifiedMiddlewareFactory,
				}) =>
					new ContentMiddlewareFactory(
						projectResolveMiddlewareFactory,
						stageResolveMiddlewareFactory,
						authMiddlewareFactory,
						projectMemberMiddlewareFactory,
						notModifiedMiddlewareFactory,
					),
			)
			.addService(
				'systemMiddlewareFactory',
				({
					projectResolveMiddlewareFactory,
					authMiddlewareFactory,
					projectMemberMiddlewareFactory,
					databaseTransactionMiddlewareFactory,
					setupSystemVariablesMiddlewareFactory,
				}) =>
					new SystemMiddlewareFactory(
						projectResolveMiddlewareFactory,
						authMiddlewareFactory,
						projectMemberMiddlewareFactory,
						databaseTransactionMiddlewareFactory,
						setupSystemVariablesMiddlewareFactory,
					),
			)
			.addService('timerMiddlewareFactory', () => new TimerMiddlewareFactory())
			.addService('errorResponseMiddlewareFactory', () => new ErrorResponseMiddlewareFactory(debug))

			.addService(
				'middlewareStackFactory',
				({
					timerMiddlewareFactory,
					homepageMiddlewareFactory,
					contentMiddlewareFactory,
					tenantMiddlewareFactory,
					systemMiddlewareFactory,
					errorResponseMiddlewareFactory,
				}) =>
					new MiddlewareStackFactory(
						timerMiddlewareFactory,
						errorResponseMiddlewareFactory,
						homepageMiddlewareFactory,
						contentMiddlewareFactory,
						tenantMiddlewareFactory,
						systemMiddlewareFactory,
					),
			)

			.addService('koa', ({ middlewareStackFactory }) => {
				const app = new Koa()
				app.use(middlewareStackFactory.create())

				return app
			})
			.addService(
				'tenantMigrationsRunner',
				() => new MigrationsRunner(config.tenant.db, 'tenant', getTenantMigrationsDirectory()),
			)
			.addService(
				'initializer',
				({ tenantMigrationsRunner }) =>
					new Initializer(tenantMigrationsRunner, tenantContainer.projectManager, containerList),
			)
			.addService('serverRunner', ({ koa }) => new ServerRunner(koa, config))

			.build()

		return masterContainer.pick('initializer', 'serverRunner', 'koa')
	}

	createProjectContainers(
		debug: boolean,
		projects: Array<Project>,
		projectsDir: string,
		schemas: undefined | Record<string, Schema>,
		plugins: Plugin[],
	): Record<string, ProjectContainer> {
		const containers = Object.values(projects).map((project: Project) => {
			const projectContainer = new Builder({})
				.addService('providers', () => providers)
				.addService('project', () => project)
				.addService('projectsDir', () => projectsDir)
				.addService('graphqlObjectsFactory', () => graphqlObjectFactories)
				.addService('schema', ({ project }) => (schemas ? schemas[project.slug] : undefined))
				.addService('connection', ({ project }) => {
					return new Connection(
						{
							host: project.db.host,
							port: project.db.port,
							user: project.db.user,
							password: project.db.password,
							database: project.db.database,
						},
						{ timing: true },
					)
				})
				.addService(
					'systemDbMigrationsRunner',
					() => new MigrationsRunner(project.db, 'system', getSystemMigrationsDirectory()),
				)

				.addService('systemDbClient', ({ connection }) => connection.createClient('system'))
				.addService('systemQueryHandler', ({ systemDbClient }) => systemDbClient.createQueryHandler())
				.addService(
					'modificationHandlerFactory',
					() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
				)
				.addService(
					'schemaMigrator',
					({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory),
				)
				.addService(
					'executedMigrationsResolver',
					({ systemQueryHandler }) => new ExecutedMigrationsResolver(systemQueryHandler),
				)
				.addService(
					'schemaVersionBuilder',
					({ executedMigrationsResolver, schemaMigrator }) =>
						new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator),
				)
				.addService('graphQlSchemaBuilderFactory', () => new GraphQlSchemaBuilderFactory(graphqlObjectFactories))
				.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
				.addService(
					'contentPermissionsVerifier',
					({ permissionsByIdentityFactory }) => new PermissionsVerifier(permissionsByIdentityFactory),
				)
				.addService('graphQlSchemaFactory', container => {
					const contributors = plugins
						.map(it => (it.getSchemaContributor ? it.getSchemaContributor(container) : null))
						.filter((it): it is GraphQLSchemaContributor => !!it)
					return new GraphQlSchemaFactory(
						container.graphQlSchemaBuilderFactory,
						container.permissionsByIdentityFactory,
						contributors,
					)
				})
				.addService('apolloServerFactory', ({ project }) => new ContentApolloServerFactory(project.slug, debug))
				.addService(
					'contentApolloMiddlewareFactory',
					({ project, schemaVersionBuilder, graphQlSchemaFactory, apolloServerFactory, schema }) =>
						new ContentApolloMiddlewareFactory(
							project,
							schemaVersionBuilder,
							graphQlSchemaFactory,
							apolloServerFactory,
							schema,
						),
				)
				.build()

			const systemContainer = new SystemContainerFactory().create(
				projectContainer.pick(
					'projectsDir',
					'project',
					'contentPermissionsVerifier',
					'modificationHandlerFactory',
					'schemaVersionBuilder',
					'providers',
				),
			)

			const systemIntermediateContainer = new Builder({})
				.addService(
					'systemApolloServerFactory',
					() =>
						new SystemApolloServerFactory(
							systemContainer.systemResolvers,
							systemContainer.authorizator,
							systemContainer.systemExecutionContainerFactory,
							project.slug,
						),
				)
				.build()

			const projectServices = projectContainer.pick(
				'project',
				'contentApolloMiddlewareFactory',
				'systemDbClient',
				'systemQueryHandler',
				'connection',
				'systemDbMigrationsRunner',
				'schemaVersionBuilder',
			)

			return tuple(
				project.slug,
				mergeContainers(
					mergeContainers(projectServices, systemIntermediateContainer),
					systemContainer.pick('systemExecutionContainerFactory'),
				),
			)
		})
		return Object.fromEntries(containers)
	}

	createTenantContainer(
		tenantConfig: TenantConfig,
		providers: TenantProviders,
		projectContainerResolver: ProjectContainerResolver,
	) {
		return new TenantContainer.Factory().create(
			tenantConfig.db,
			tenantConfig.mailer,
			providers,
			projectVariablesResolver(projectContainerResolver),
		)
	}
}

export default CompositionRoot

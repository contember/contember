import Koa from 'koa'
import { Connection } from '@contember/database'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import { SystemContainerFactory } from '@contember/engine-system-api'
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
	GraphQlSchemaFactory,
	HomepageMiddlewareFactory,
	MiddlewareStackFactory,
	NotModifiedMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
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
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer, ServerRunner } from './bootstrap'
import { ProjectContainer, ProjectContainerResolver } from './ProjectContainer'
import { ErrorResponseMiddlewareFactory } from './http/ErrorResponseMiddlewareFactory'
import { tuple } from './utils'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import { MigrationsRunner } from '@contember/database-migrations'
import { ContentSchemaResolver } from './http/content/ContentSchemaResolver'

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
			.addService('tenantApolloServer', ({ tenantContainer }) =>
				new TenantApolloServerFactory(tenantContainer.resolvers, tenantContainer.resolverContextFactory).create(),
			)
			.addService(
				'tenantMiddlewareFactory',
				({ tenantApolloServer, authMiddlewareFactory }) =>
					new TenantMiddlewareFactory(tenantApolloServer, authMiddlewareFactory),
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
				({ projectResolveMiddlewareFactory, authMiddlewareFactory, projectMemberMiddlewareFactory }) =>
					new SystemMiddlewareFactory(
						projectResolveMiddlewareFactory,
						authMiddlewareFactory,
						projectMemberMiddlewareFactory,
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
		const containers = Object.values(projects).map((project: Project): [string, ProjectContainer] => {
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
					'modificationHandlerFactory',
					() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
				)

				.addService('graphQlSchemaBuilderFactory', () => new GraphQlSchemaBuilderFactory(graphqlObjectFactories))
				.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
				.addService(
					'contentPermissionsVerifier',
					({ permissionsByIdentityFactory }) => new PermissionsVerifier(permissionsByIdentityFactory),
				)

				.build()

			const systemContainer = new SystemContainerFactory().create(
				projectContainer.pick(
					'connection',
					'projectsDir',
					'project',
					'contentPermissionsVerifier',
					'modificationHandlerFactory',
					'providers',
				),
			)

			const httpContainer = new Builder({})
				.addService(
					'systemApolloServerFactory',
					() =>
						new SystemApolloServerFactory(
							systemContainer.systemResolvers,
							systemContainer.resolverContextFactory,
							project.slug,
						),
				)
				.addService('graphQlSchemaFactory', () => {
					const container = projectContainer
					const contributors = plugins
						.map(it => (it.getSchemaContributor ? it.getSchemaContributor(container) : null))
						.filter((it): it is GraphQLSchemaContributor => !!it)
					return new GraphQlSchemaFactory(
						container.graphQlSchemaBuilderFactory,
						container.permissionsByIdentityFactory,
						contributors,
					)
				})
				.addService('apolloServerFactory', () => new ContentApolloServerFactory(project.slug, debug))
				.addService(
					'contentSchemaResolver',
					() =>
						new ContentSchemaResolver(
							systemContainer.schemaVersionBuilder,
							systemContainer.systemDatabaseContextFactory.create(undefined),
						),
				)
				.addService(
					'contentApolloMiddlewareFactory',
					({ contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory }) =>
						new ContentApolloMiddlewareFactory(contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory),
				)
				.build()

			const projectServices = projectContainer.pick('project', 'connection')
			const systemServices = systemContainer.pick(
				'systemDatabaseContextFactory',
				'schemaVersionBuilder',
				'projectInitializer',
				'systemDbMigrationsRunner',
			)
			const httpServices = httpContainer.pick('contentApolloMiddlewareFactory', 'systemApolloServerFactory')

			return tuple(project.slug, mergeContainers(mergeContainers(projectServices, systemServices), httpServices))
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

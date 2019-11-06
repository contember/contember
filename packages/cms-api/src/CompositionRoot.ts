import Koa from 'koa'
import { Connection } from '@contember/database'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import {
	createMigrationFilesManager as createSystemMigrationFilesManager,
	MigrationsResolver,
	SchemaMigrator,
	SchemaVersionBuilder,
	SystemContainerFactory,
} from '@contember/engine-system-api'
import { DatabaseCredentials, MigrationFilesManager } from '@contember/engine-common'
import {
	createMigrationFilesManager as createTenantMigrationFilesManager,
	Providers as TenantProviders,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { Schema } from '@contember/schema'
import { Builder } from '@contember/dic'
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
import { Config, ProjectWithS3 } from './config/config'
import { S3SchemaFactory, S3Service } from '@contember/engine-s3-plugin'
import { providers } from './utils/providers'
import { graphqlObjectFactories } from './utils/graphqlObjectFactories'
import { getArgumentValues } from 'graphql/execution/values'
import { projectVariablesResolver } from './utils/projectVariablesProvider'
import {
	ModificationHandlerFactory,
	SchemaVersionBuilder as SchemaVersionBuilderInternal,
} from '@contember/schema-migrations'
import { Initializer, MigrationsRunner, ServerRunner } from './bootstrap'
import { ProjectContainer, ProjectContainerResolver } from './ProjectContainer'

export interface MasterContainer {
	initializer: Initializer
	serverRunner: ServerRunner
	koa: Koa
}

class CompositionRoot {
	createMasterContainer(
		config: Config,
		projectsDirectory: string,
		projectSchemas?: { [name: string]: Schema },
	): MasterContainer {
		const projectContainers = this.createProjectContainers(config.projects, projectsDirectory, projectSchemas)

		const projectContainerResolver: ProjectContainerResolver = slug =>
			projectContainers.find(it => it.project.slug === slug)

		const tenantContainer = this.createTenantContainer(config.tenant.db, providers, projectContainerResolver)

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
				new TenantApolloServerFactory(
					tenantContainer.resolvers,
					tenantContainer.resolverContextFactory,
					tenantContainer.errorFormatter,
				).create(),
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
					databaseTransactionMiddlewareFactory,
					setupSystemVariablesMiddlewareFactory,
					notModifiedMiddlewareFactory,
				}) =>
					new ContentMiddlewareFactory(
						projectResolveMiddlewareFactory,
						stageResolveMiddlewareFactory,
						authMiddlewareFactory,
						projectMemberMiddlewareFactory,
						databaseTransactionMiddlewareFactory,
						setupSystemVariablesMiddlewareFactory,
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

			.addService(
				'middlewareStackFactory',
				({
					timerMiddlewareFactory,
					homepageMiddlewareFactory,
					contentMiddlewareFactory,
					tenantMiddlewareFactory,
					systemMiddlewareFactory,
				}) =>
					new MiddlewareStackFactory(
						timerMiddlewareFactory,
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
				() => new MigrationsRunner(config.tenant.db, 'tenant', createTenantMigrationFilesManager().directory),
			)
			.addService(
				'initializer',
				({ tenantMigrationsRunner }) =>
					new Initializer(tenantMigrationsRunner, tenantContainer.projectManager, projectContainers),
			)
			.addService('serverRunner', ({ koa }) => new ServerRunner(koa, config))

			.build()

		return masterContainer.pick('initializer', 'serverRunner', 'koa')
	}

	createProjectContainers(
		projects: Array<ProjectWithS3>,
		projectsDir: string,
		schemas?: Record<string, Schema>,
	): ProjectContainer[] {
		return projects.map((project: ProjectWithS3) => {
			const projectContainer = new Builder({})
				.addService('providers', () => providers)
				.addService('project', () => project)
				.addService('schema', ({ project }) => (schemas ? schemas[project.slug] : undefined))
				.addService('connection', ({ project }) => {
					return new Connection(
						{
							host: project.dbCredentials.host,
							port: project.dbCredentials.port,
							user: project.dbCredentials.user,
							password: project.dbCredentials.password,
							database: project.dbCredentials.database,
						},
						{ timing: true },
					)
				})
				.addService(
					'systemDbMigrationsRunner',
					() => new MigrationsRunner(project.dbCredentials, 'system', createSystemMigrationFilesManager().directory),
				)
				.addService('migrationFilesManager', ({ project }) =>
					MigrationFilesManager.createForProject(projectsDir, project.directory || project.slug),
				)
				.addService('migrationsResolver', ({ migrationFilesManager }) => new MigrationsResolver(migrationFilesManager))
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
					'schemaVersionBuilder',
					({ systemQueryHandler, migrationsResolver, schemaMigrator }) =>
						new SchemaVersionBuilder(
							systemQueryHandler,
							new SchemaVersionBuilderInternal(migrationsResolver, schemaMigrator),
						),
				)
				.addService('s3', ({ project }) => {
					return new S3Service(project.s3)
				})
				.addService('s3SchemaFactory', ({ s3 }) => {
					return new S3SchemaFactory(graphqlObjectFactories, s3)
				})
				.addService(
					'graphQlSchemaBuilderFactory',
					() => new GraphQlSchemaBuilderFactory(graphqlObjectFactories, getArgumentValues),
				)
				.addService(
					'permissionsByIdentityFactory',
					({}) => new PermissionsByIdentityFactory([new PermissionsByIdentityFactory.RoleBasedPermissionFactory()]),
				)
				.addService(
					'contentPermissionsVerifier',
					({ permissionsByIdentityFactory }) => new PermissionsVerifier(permissionsByIdentityFactory),
				)
				.addService(
					'graphQlSchemaFactory',
					({ graphQlSchemaBuilderFactory, permissionsByIdentityFactory, s3SchemaFactory }) =>
						new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory, s3SchemaFactory),
				)
				.addService('apolloServerFactory', () => new ContentApolloServerFactory())
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
					'project',
					'migrationsResolver',
					'migrationFilesManager',
					'contentPermissionsVerifier',
					'schemaMigrator',
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
						),
				)
				.build()

			return projectContainer
				.pick(
					'project',
					'contentApolloMiddlewareFactory',
					'systemDbClient',
					'systemQueryHandler',
					'connection',
					'systemDbMigrationsRunner',
					'schemaVersionBuilder',
				)
				.merge(systemIntermediateContainer)
				.merge(systemContainer.pick('systemExecutionContainerFactory'))
		})
	}

	createTenantContainer(
		tenantDbCredentials: DatabaseCredentials,
		providers: TenantProviders,
		projectContainerResolver: ProjectContainerResolver,
	) {
		return new TenantContainer.Factory().create(
			tenantDbCredentials,
			providers,
			projectVariablesResolver(projectContainerResolver),
		)
	}
}

export default CompositionRoot

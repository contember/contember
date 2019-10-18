import Koa from 'koa'
import { Client, Connection } from '@contember/database'
import {
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
	PermissionsVerifier,
} from '@contember/engine-content-api'
import {
	createMigrationFilesManager,
	MigrationsResolver,
	SchemaMigrator,
	SchemaVersionBuilder,
	SystemContainerFactory,
	SystemExecutionContainer,
} from '@contember/engine-system-api'
import { DatabaseCredentials, MigrationFilesManager, MigrationsRunner } from '@contember/engine-common'
import { Providers as TenantProviders, TenantContainer } from '@contember/engine-tenant-api'
import { Schema } from '@contember/schema'
import { Builder, Container } from '@contember/dic'
import AuthMiddlewareFactory from './http/AuthMiddlewareFactory'
import TenantMiddlewareFactory from './http/TenantMiddlewareFactory'
import ContentMiddlewareFactory from './http/ContentMiddlewareFactory'
import { Config, ProjectWithS3 } from './config/config'
import TimerMiddlewareFactory from './http/TimerMiddlewareFactory'
import GraphQlSchemaFactory from './http/GraphQlSchemaFactory'
import SystemMiddlewareFactory from './http/SystemMiddlewareFactory'
import SystemApolloServerFactory from './http/SystemApolloServerFactory'
import HomepageMiddlewareFactory from './http/HomepageMiddlewareFactory'
import MiddlewareStackFactory from './http/MiddlewareStackFactory'
import ContentApolloMiddlewareFactory from './http/ContentApolloMiddlewareFactory'
import ProjectResolveMiddlewareFactory from './http/ProjectResolveMiddlewareFactory'
import ProjectMemberMiddlewareFactory from './http/ProjectMemberMiddlewareFactory'
import StageResolveMiddlewareFactory from './http/StageResolveMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './http/DatabaseTransactionMiddlewareFactory'
import SetupSystemVariablesMiddlewareFactory from './http/SetupSystemVariablesMiddlewareFactory'
import ContentApolloServerFactory from './http/ContentApolloServerFactory'
import Application from './core/cli/Application'
import DiffCommand from './cli/DiffCommand'
import UpdateCommand from './cli/UpdateCommand'
import DropCommand from './cli/DropCommand'
import StartCommand from './cli/StartCommand'
import { CommandManager } from './core/cli/CommandManager'
import SetupCommand from './cli/SetupCommand'
import DryRunCommand from './cli/DryRunCommand'
import { S3SchemaFactory, S3Service } from '@contember/engine-s3-plugin'
import TenantApolloServerFactory from './http/TenantApolloServerFactory'
import { providers } from './utils/providers'
import { graphqlObjectFactories } from './utils/graphqlObjectFactories'
import { getArgumentValues } from 'graphql/execution/values'
import { projectVariablesResolver } from './utils/projectVariablesProvider'
import {
	ModificationHandlerFactory,
	SchemaVersionBuilder as SchemaVersionBuilderInternal,
} from '@contember/schema-migrations'

export type ProjectContainer = Container<{
	project: ProjectWithS3
	systemDbClient: Client
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
	connection: Connection
	systemDbMigrationsRunner: MigrationsRunner
	schemaVersionBuilder: SchemaVersionBuilder
}>

export interface MasterContainer {
	cli: Application
}

export type ProjectContainerResolver = (slug: string) => ProjectContainer | undefined

class CompositionRoot {
	createMasterContainer(
		config: Config,
		projectsDirectory: string,
		projectSchemas: { [name: string]: Schema },
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
			.addService(
				'contentMiddlewareFactory',
				({
					authMiddlewareFactory,
					projectMemberMiddlewareFactory,
					projectResolveMiddlewareFactory,
					stageResolveMiddlewareFactory,
					databaseTransactionMiddlewareFactory,
					setupSystemVariablesMiddlewareFactory,
				}) =>
					new ContentMiddlewareFactory(
						projectResolveMiddlewareFactory,
						stageResolveMiddlewareFactory,
						authMiddlewareFactory,
						projectMemberMiddlewareFactory,
						databaseTransactionMiddlewareFactory,
						setupSystemVariablesMiddlewareFactory,
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
				'commandManager',
				({ projectContainerResolver, koa }) =>
					new CommandManager({
						['diff']: () => new DiffCommand(projectContainerResolver, projectSchemas),
						['update']: () =>
							new UpdateCommand(tenantContainer.dbMigrationsRunner, tenantContainer.projectManager, projectContainers),
						['drop']: () => new DropCommand(config),
						['start']: () => new StartCommand(koa, config),
						['setup']: () => new SetupCommand(tenantContainer.signUpManager, tenantContainer.apiKeyManager),
						['dry-run-sql']: () => new DryRunCommand(projectContainers),
					}),
			)
			.addService('cli', ({ commandManager }) => new Application(commandManager))

			.build()

		return masterContainer.pick('cli')
	}

	createProjectContainers(
		projects: Array<ProjectWithS3>,
		projectsDir: string,
		schemas: Record<string, Schema>,
	): ProjectContainer[] {
		return projects.map((project: ProjectWithS3) => {
			const projectContainer = new Builder({})
				.addService('providers', () => providers)
				.addService('project', () => project)
				.addService('schema', ({ project }) => schemas[project.slug])
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
					() => new MigrationsRunner(project.dbCredentials, 'system', createMigrationFilesManager().directory),
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
					({}) =>
						new PermissionsByIdentityFactory([
							new PermissionsByIdentityFactory.SuperAdminPermissionFactory(),
							new PermissionsByIdentityFactory.RoleBasedPermissionFactory(),
						]),
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
				.addService('apolloServerFactory', ({ connection }) => new ContentApolloServerFactory(connection))
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

import Koa from 'koa'
import Container from './core/di/Container'
import Project from './config/Project'
import AuthMiddlewareFactory from './http/AuthMiddlewareFactory'
import TenantMiddlewareFactory from './http/TenantMiddlewareFactory'
import ContentMiddlewareFactory from './http/ContentMiddlewareFactory'
import GraphQlSchemaBuilderFactory from './content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import { Config, DatabaseCredentials } from './config/config'
import S3 from './utils/S3'
import TimerMiddlewareFactory from './http/TimerMiddlewareFactory'
import GraphQlSchemaFactory from './http/GraphQlSchemaFactory'
import SystemMiddlewareFactory from './http/SystemMiddlewareFactory'
import SchemaVersionBuilder from './content-schema/SchemaVersionBuilder'
import SystemContainerFactory from './system-api/SystemContainerFactory'
import SystemApolloServerFactory from './http/SystemApolloServerFactory'
import MigrationFilesManager from './migrations/MigrationFilesManager'
import MigrationsResolver from './content-schema/MigrationsResolver'
import PermissionsByIdentityFactory from './acl/PermissionsByIdentityFactory'
import HomepageMiddlewareFactory from './http/HomepageMiddlewareFactory'
import MiddlewareStackFactory from './http/MiddlewareStackFactory'
import ContentApolloMiddlewareFactory from './http/ContentApolloMiddlewareFactory'
import ProjectResolveMiddlewareFactory from './http/ProjectResolveMiddlewareFactory'
import ProjectMemberMiddlewareFactory from './http/ProjectMemberMiddlewareFactory'
import StageResolveMiddlewareFactory from './http/StageResolveMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './http/DatabaseTransactionMiddlewareFactory'
import SetupSystemVariablesMiddlewareFactory from './http/SetupSystemVariablesMiddlewareFactory'
import ContentApolloServerFactory from './http/ContentApolloServerFactory'
import SchemaMigrator from './content-schema/differ/SchemaMigrator'
import ModificationHandlerFactory from './system-api/model/migrations/modifications/ModificationHandlerFactory'
import Application from './core/cli/Application'
import DiffCommand from './cli/DiffCommand'
import UpdateCommand from './cli/UpdateCommand'
import DropCommand from './cli/DropCommand'
import StartCommand from './cli/StartCommand'
import { CommandManager } from './core/cli/CommandManager'
import { Schema } from '@contember/schema'
import SystemExecutionContainer from './system-api/SystemExecutionContainer'
import TenantContainer from './tenant-api/TenantContainer'
import Connection from './core/database/Connection'
import Client from './core/database/Client'
import MigrationsRunner from './core/migrations/MigrationsRunner'
import SetupCommand from './cli/SetupCommand'
import DryRunCommand from './cli/DryRunCommand'

export type ProjectContainer = Container<{
	project: Project
	systemDbClient: Client
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
	connection: Connection
	systemDbMigrationsRunner: MigrationsRunner
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
		const tenantContainer = this.createTenantContainer(config.tenant.db)
		const projectContainers = this.createProjectContainers(config.projects, projectsDirectory, projectSchemas)

		const masterContainer = new Container.Builder({})
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainers', () => projectContainers)
			.addService(
				'projectContainerResolver',
				({ projectContainers }): ProjectContainerResolver => slug =>
					projectContainers.find(it => it.project.slug === slug),
			)

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
				({ projectContainers }) => new ProjectResolveMiddlewareFactory(projectContainers),
			)
			.addService('stageResolveMiddlewareFactory', () => new StageResolveMiddlewareFactory())
			.addService('databaseTransactionMiddlewareFactory', () => {
				return new DatabaseTransactionMiddlewareFactory()
			})
			.addService(
				'tenantMiddlewareFactory',
				({ tenantContainer, authMiddlewareFactory }) =>
					new TenantMiddlewareFactory(tenantContainer.apolloServer, authMiddlewareFactory),
			)
			.addService('setupSystemVariablesMiddlewareFactory', () => new SetupSystemVariablesMiddlewareFactory())
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
		projects: Array<Project>,
		projectsDir: string,
		schemas: Record<string, Schema>,
	): ProjectContainer[] {
		return projects.map((project: Project) => {
			const projectContainer = new Container.Builder({})
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
					() =>
						new MigrationsRunner(
							project.dbCredentials,
							'system',
							MigrationFilesManager.createForEngine('project').directory,
						),
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
						new SchemaVersionBuilder(systemQueryHandler, migrationsResolver, schemaMigrator),
				)
				.addService('s3', ({ project }) => {
					return new S3(project.s3)
				})
				.addService('graphQlSchemaBuilderFactory', ({ s3 }) => new GraphQlSchemaBuilderFactory(s3))
				.addService(
					'permissionsByIdentityFactory',
					({}) =>
						new PermissionsByIdentityFactory([
							new PermissionsByIdentityFactory.SuperAdminPermissionFactory(),
							new PermissionsByIdentityFactory.RoleBasedPermissionFactory(),
						]),
				)
				.addService(
					'graphQlSchemaFactory',
					({ graphQlSchemaBuilderFactory, permissionsByIdentityFactory }) =>
						new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory),
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
					'permissionsByIdentityFactory',
					'schemaMigrator',
					'modificationHandlerFactory',
					'schemaVersionBuilder',
				),
			)

			return projectContainer
				.pick('project', 'contentApolloMiddlewareFactory', 'systemDbClient', 'connection', 'systemDbMigrationsRunner')
				.merge(systemContainer.pick('systemApolloServerFactory', 'systemExecutionContainerFactory'))
		})
	}

	createTenantContainer(tenantDbCredentials: DatabaseCredentials) {
		return new TenantContainer.Factory().create(tenantDbCredentials)
	}
}

export default CompositionRoot

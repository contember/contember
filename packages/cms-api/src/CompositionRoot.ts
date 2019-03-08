import knex from 'knex'
import Koa from 'koa'
import SignInMutationResolver from './tenant-api/resolvers/mutation/SignInMutationResolver'
import KnexConnection from './core/knex/KnexConnection'
import QueryHandler from './core/query/QueryHandler'
import KnexQueryable from './core/knex/KnexQueryable'
import SignInManager from './tenant-api/model/service/SignInManager'
import SignUpManager from './tenant-api/model/service/SignUpManager'
import SignUpMutationResolver from './tenant-api/resolvers/mutation/SignUpMutationResolver'
import MeQueryResolver from './tenant-api/resolvers/query/MeQueryResolver'
import ProjectMemberManager from './tenant-api/model/service/ProjectMemberManager'
import ApiKeyManager from './tenant-api/model/service/ApiKeyManager'
import Container from './core/di/Container'
import Project from './config/Project'
import AuthMiddlewareFactory from './http/AuthMiddlewareFactory'
import TenantMiddlewareFactory from './http/TenantMiddlewareFactory'
import ContentMiddlewareFactory from './http/ContentMiddlewareFactory'
import GraphQlSchemaBuilderFactory from './content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import { DatabaseCredentials } from './config/config'
import S3 from './utils/S3'
import AddProjectMemberMutationResolver from './tenant-api/resolvers/mutation/AddProjectMemberMutationResolver'
import ResolverFactory from './tenant-api/resolvers/ResolverFactory'
import TimerMiddlewareFactory from './http/TimerMiddlewareFactory'
import TenantApolloServerFactory from './http/TenantApolloServerFactory'
import SetupMutationResolver from './tenant-api/resolvers/mutation/SetupMutationResolver'
import Authorizator from './core/authorization/Authorizator'
import AccessEvaluator from './core/authorization/AccessEvalutator'
import PermissionsFactory from './tenant-api/model/authorization/PermissionsFactory'
import UpdateProjectMemberVariablesMutationResolver from './tenant-api/resolvers/mutation/UpdateProjectMemberVariablesMutationResolver'
import GraphQlSchemaFactory from './http/GraphQlSchemaFactory'
import ProjectSchemaInfo from './config/ProjectSchemaInfo'
import KnexWrapper from './core/knex/KnexWrapper'
import SystemMiddlewareFactory from './http/SystemMiddlewareFactory'
import SchemaVersionBuilder from './content-schema/SchemaVersionBuilder'
import { IResolvers } from 'graphql-tools'
import SystemContainerFactory from './system-api/SystemContainerFactory'
import SystemApolloServerFactory from './http/SystemApolloServerFactory'
import MigrationFilesManager from './migrations/MigrationFilesManager'
import SchemaMigrationDiffsResolver from './content-schema/SchemaMigrationDiffsResolver'
import PermissionsByIdentityFactory from './acl/PermissionsByIdentityFactory'
import KnexDebugger from './core/knex/KnexDebugger'
import HomepageMiddlewareFactory from './http/HomepageMiddlewareFactory'
import MiddlewareStackFactory from './http/MiddlewareStackFactory'
import ContentApolloMiddlewareFactory from './http/ContentApolloMiddlewareFactory'
import ProjectResolveMiddlewareFactory from './http/ProjectResolveMiddlewareFactory'
import ProjectMemberMiddlewareFactory from './http/ProjectMemberMiddlewareFactory'
import StageResolveMiddlewareFactory from './http/StageResolveMiddlewareFactory'
import DatabaseTransactionMiddlewareFactory from './http/DatabaseTransactionMiddlewareFactory'
import SetupSystemVariablesMiddlewareFactory from './http/SetupSystemVariablesMiddlewareFactory'
import ContentApolloServerFactory from './http/ContentApolloServerFactory'
import CreateApiKeyMutationResolver from './tenant-api/resolvers/mutation/CreateApiKeyMutationResolver'

export type ProjectContainer = Container<{
	project: ProjectSchemaInfo & Project
	knexConnection: knex
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
}>

class CompositionRoot {
	composeServer(
		tenantDbCredentials: DatabaseCredentials,
		projects: Array<ProjectSchemaInfo & Project>,
		projectsDirectory: string
	): Koa {
		const tenantContainer = this.createTenantContainer(tenantDbCredentials)
		const projectContainers = this.createProjectContainers(projects, projectsDirectory)

		const masterContainer = new Container.Builder({})
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainers', () => projectContainers)

			.addService('homepageMiddlewareFactory', () => new HomepageMiddlewareFactory())

			.addService(
				'authMiddlewareFactory',
				({ tenantContainer }) => new AuthMiddlewareFactory(tenantContainer.get('apiKeyManager'))
			)
			.addService(
				'projectMemberMiddlewareFactory',
				({ tenantContainer }) => new ProjectMemberMiddlewareFactory(tenantContainer.projectMemberManager)
			)
			.addService(
				'projectResolveMiddlewareFactory',
				({ projectContainers }) => new ProjectResolveMiddlewareFactory(projectContainers)
			)
			.addService('stageResolveMiddlewareFactory', () => new StageResolveMiddlewareFactory())
			.addService('databaseTransactionMiddlewareFactory', () => {
				return new DatabaseTransactionMiddlewareFactory()
			})
			.addService(
				'tenantMiddlewareFactory',
				({ tenantContainer, authMiddlewareFactory }) =>
					new TenantMiddlewareFactory(tenantContainer.get('apolloServer'), authMiddlewareFactory)
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
						setupSystemVariablesMiddlewareFactory
					)
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
						setupSystemVariablesMiddlewareFactory
					)
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
						systemMiddlewareFactory
					)
			)

			.addService('koa', ({ middlewareStackFactory }) => {
				const app = new Koa()
				app.use(middlewareStackFactory.create())

				return app
			})
			.build()

		return masterContainer.get('koa')
	}

	createProjectContainers(projects: Array<ProjectSchemaInfo & Project>, projectsDir: string): ProjectContainer[] {
		return projects.map((project: ProjectSchemaInfo & Project) => {
			const projectContainer = new Container.Builder({})
				.addService('project', () => project)
				.addService('aclSchema', ({ project }) => project.acl)
				.addService('knexDebugger', () => new KnexDebugger())
				.addService('knexConnection', ({ project, knexDebugger }) => {
					const knexInst = knex({
						debug: false,
						client: 'pg',
						connection: {
							host: project.dbCredentials.host,
							port: project.dbCredentials.port,
							user: project.dbCredentials.user,
							password: project.dbCredentials.password,
							database: project.dbCredentials.database,
						},
					})
					knexDebugger.register(knexInst)

					return knexInst
				})
				.addService('migrationFilesManager', ({ project }) =>
					MigrationFilesManager.createForProject(projectsDir, project.slug)
				)
				.addService(
					'schemaMigrationDiffsResolver',
					({ migrationFilesManager }) => new SchemaMigrationDiffsResolver(migrationFilesManager)
				)
				.addService('systemKnexWrapper', ({ knexConnection }) => new KnexWrapper(knexConnection, 'system'))
				.addService('systemQueryHandler', ({ systemKnexWrapper }) => systemKnexWrapper.createQueryHandler())
				.addService(
					'schemaVersionBuilder',
					({ systemQueryHandler, schemaMigrationDiffsResolver }) =>
						new SchemaVersionBuilder(systemQueryHandler, schemaMigrationDiffsResolver.resolve())
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
						])
				)
				.addService(
					'graphQlSchemaFactory',
					({ graphQlSchemaBuilderFactory, permissionsByIdentityFactory }) =>
						new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory)
				)
				.addService('apolloServerFactory', ({ knexDebugger }) => new ContentApolloServerFactory(knexDebugger))
				.addService(
					'contentApolloMiddlewareFactory',
					({ project, schemaVersionBuilder, graphQlSchemaFactory, apolloServerFactory }) =>
						new ContentApolloMiddlewareFactory(project, schemaVersionBuilder, graphQlSchemaFactory, apolloServerFactory)
				)
				.build()

			const systemContainer = new SystemContainerFactory().create(
				projectContainer.pick(
					'project',
					'schemaMigrationDiffsResolver',
					'migrationFilesManager',
					'permissionsByIdentityFactory',
					'aclSchema'
				)
			)

			return projectContainer
				.pick('project', 'knexConnection', 'contentApolloMiddlewareFactory')
				.merge(systemContainer.pick('systemApolloServerFactory'))
		})
	}

	createTenantContainer(tenantDbCredentials: DatabaseCredentials) {
		return new Container.Builder({})
			.addService('knexDebugger', () => {
				return new KnexDebugger()
			})
			.addService('knexConnection', ({ knexDebugger }) => {
				const knexInst = knex({
					debug: false,
					client: 'pg',
					connection: tenantDbCredentials,
				})
				knexDebugger.register(knexInst)
				return new KnexConnection(knexInst, 'tenant')
			})
			.addService('queryHandler', ({ knexConnection }) => {
				const handler = new QueryHandler(
					new KnexQueryable(knexConnection, {
						get(): QueryHandler<KnexQueryable> {
							return handler
						},
					})
				)

				return handler
			})

			.addService(
				'apiKeyManager',
				({ queryHandler, knexConnection }) => new ApiKeyManager(queryHandler, knexConnection.wrapper())
			)
			.addService(
				'signUpManager',
				({ queryHandler, knexConnection }) => new SignUpManager(queryHandler, knexConnection.wrapper())
			)
			.addService('signInManager', ({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager))
			.addService(
				'projectMemberManager',
				({ queryHandler, knexConnection }) => new ProjectMemberManager(queryHandler, knexConnection.wrapper())
			)

			.addService('meQueryResolver', ({ queryHandler }) => new MeQueryResolver(queryHandler))
			.addService(
				'signUpMutationResolver',
				({ signUpManager, queryHandler, apiKeyManager }) =>
					new SignUpMutationResolver(signUpManager, queryHandler, apiKeyManager)
			)
			.addService(
				'signInMutationResolver',
				({ signInManager, queryHandler }) => new SignInMutationResolver(signInManager, queryHandler)
			)
			.addService(
				'addProjectMemberMutationResolver',
				({ projectMemberManager }) => new AddProjectMemberMutationResolver(projectMemberManager)
			)
			.addService(
				'setupMutationResolver',
				({ signUpManager, apiKeyManager, queryHandler }) =>
					new SetupMutationResolver(signUpManager, queryHandler, apiKeyManager)
			)
			.addService(
				'updateProjectMemberVariablesMutationResolver',
				({ projectMemberManager }) => new UpdateProjectMemberVariablesMutationResolver(projectMemberManager)
			)
			.addService(
				'createApiKeyMutationResolver',
				({ apiKeyManager }) => new CreateApiKeyMutationResolver(apiKeyManager)
			)

			.addService(
				'resolvers',
				({
					meQueryResolver,
					signUpMutationResolver,
					signInMutationResolver,
					addProjectMemberMutationResolver,
					setupMutationResolver,
					updateProjectMemberVariablesMutationResolver,
					createApiKeyMutationResolver,
				}) => {
					return new ResolverFactory(
						meQueryResolver,
						signUpMutationResolver,
						signInMutationResolver,
						addProjectMemberMutationResolver,
						setupMutationResolver,
						updateProjectMemberVariablesMutationResolver,
						createApiKeyMutationResolver
					).create()
				}
			)
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }) => new Authorizator.Default(accessEvaluator))

			.addService('apolloServer', ({ resolvers, projectMemberManager, authorizator }) =>
				new TenantApolloServerFactory(resolvers, projectMemberManager, authorizator).create()
			)
			.build()
	}
}

export default CompositionRoot

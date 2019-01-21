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
import SystemResolverFactory from './system-api/resolvers/ResolverFactory'
import TimerMiddlewareFactory from './http/TimerMiddlewareFactory'
import TenantApolloServerFactory from './http/TenantApolloServerFactory'
import SetupMutationResolver from './tenant-api/resolvers/mutation/SetupMutationResolver'
import Authorizator from './core/authorization/Authorizator'
import AccessEvaluator from './core/authorization/AccessEvalutator'
import PermissionsFactory from './tenant-api/model/authorization/PermissionsFactory'
import UpdateProjectMemberVariablesMutationResolver from './tenant-api/resolvers/mutation/UpdateProjectMemberVariablesMutationResolver'
import GraphQlSchemaFactory from './http/GraphQlSchemaFactory'
import ProjectSchemaInfo from './config/ProjectSchemaInfo'
import { ApolloServer } from 'apollo-server-koa'
import SystemApolloServerFactory from './http/SystemApolloServerFactory'
import StagesQueryResolver from './system-api/resolvers/query/StagesQueryResolver'
import KnexWrapper from './core/knex/KnexWrapper'
import SystemMiddlewareFactory from './http/SystemMiddlewareFactory'
import DiffQueryResolver from './system-api/resolvers/query/DiffQueryResolver'
import DiffBuilder from './system-api/model/events/DiffBuilder'
import DependencyBuilder from './system-api/model/events/DependencyBuilder'
import MigrationsDependencyBuilder from './system-api/model/events/dependency/MigrationsDependencyBuilder'
import SameRowDependencyBuilder from './system-api/model/events/dependency/SameRowDependencyBuilder'
import TransactionDependencyBuilder from './system-api/model/events/dependency/TransactionDependencyBuilder'
import DeletedRowReferenceDependencyBuilder from './system-api/model/events/dependency/DeletedRowReferenceDependencyBuilder'
import CreatedRowReferenceDependencyBuilder from './system-api/model/events/dependency/CreatedRowReferenceDependencyBuilder'
import SchemaVersionBuilder from './content-schema/SchemaVersionBuilder'
import TableReferencingResolver from './system-api/model/events/TableReferencingResolver'
import DiffResponseBuilder from './system-api/model/events/DiffResponseBuilder'
import KnexDebugger from './core/knex/KnexDebugger'
import HomepageMiddlewareFactory from './http/HomepageMiddlewareFactory'
import CreateApiKeyMutationResolver from './tenant-api/resolvers/mutation/CreateApiKeyMutationResolver'

export type ProjectContainer = Container<{
	project: ProjectSchemaInfo & Project
	knexConnection: knex
	graphQlSchemaFactory: GraphQlSchemaFactory
	knexDebugger: KnexDebugger
	systemApollo: ApolloServer
	schemaVersionBuilder: SchemaVersionBuilder
}>

class CompositionRoot {
	composeServer(tenantDbCredentials: DatabaseCredentials, projects: Array<ProjectSchemaInfo & Project>): Koa {
		const tenantContainer = this.createTenantContainer(tenantDbCredentials)
		const projectContainers = this.createProjectContainers(projects)

		const masterContainer = new Container.Builder({})
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainers', () => projectContainers)

			.addService('homepageMiddleware', () => new HomepageMiddlewareFactory().create())

			.addService('authMiddleware', ({ tenantContainer }) =>
				new AuthMiddlewareFactory(tenantContainer.get('apiKeyManager')).create()
			)
			.addService('tenantMiddleware', ({ tenantContainer }) =>
				new TenantMiddlewareFactory(tenantContainer.get('apolloServer')).create()
			)
			.addService('contentMiddleware', ({ projectContainers, tenantContainer }) =>
				new ContentMiddlewareFactory(projectContainers, tenantContainer.get('projectMemberManager')).create()
			)
			.addService('systemMiddleware', ({ projectContainers }) =>
				new SystemMiddlewareFactory(projectContainers).create()
			)
			.addService('timerMiddleware', () => new TimerMiddlewareFactory().create())

			.addService(
				'koa',
				({ homepageMiddleware, authMiddleware, tenantMiddleware, contentMiddleware, timerMiddleware, systemMiddleware }) => {
					const app = new Koa()
					app.use(timerMiddleware)
					app.use(homepageMiddleware)
					app.use(authMiddleware)
					app.use(contentMiddleware)
					app.use(tenantMiddleware)
					app.use(systemMiddleware)

					return app
				}
			)
			.build()

		return masterContainer.get('koa')
	}

	createProjectContainers(projects: Array<ProjectSchemaInfo & Project>): ProjectContainer[] {
		return projects.map((project: ProjectSchemaInfo & Project) => {
			const container = new Container.Builder({})
				.addService('project', () => project)
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
				.addService('systemKnexWrapper', ({ knexConnection }) => new KnexWrapper(knexConnection, 'system'))
				.addService('systemQueryHandler', ({ systemKnexWrapper }) => systemKnexWrapper.createQueryHandler())
				.addService(
					'schemaVersionBuilder',
					({ systemQueryHandler, project }) => new SchemaVersionBuilder(systemQueryHandler, project.migrations)
				)
				.addService('s3', ({ project }) => {
					return new S3(project.s3)
				})
				.addService('graphQlSchemaBuilderFactory', ({ s3 }) => new GraphQlSchemaBuilderFactory(s3))
				.addService(
					'graphQlSchemaFactory',
					({ graphQlSchemaBuilderFactory }) =>
						new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, [
							new GraphQlSchemaFactory.SuperAdminPermissionFactory(),
							new GraphQlSchemaFactory.RoleBasedPermissionFactory(),
						])
				)
				.addService(
					'systemStagesQueryResolver',
					({ systemQueryHandler }) => new StagesQueryResolver(systemQueryHandler)
				)
				.addService('tableReferencingResolver', () => new TableReferencingResolver())
				.addService(
					'systemDiffDependencyBuilder',
					({ schemaVersionBuilder, tableReferencingResolver }) =>
						new DependencyBuilder.DependencyBuilderList([
							new MigrationsDependencyBuilder(),
							new SameRowDependencyBuilder(),
							new TransactionDependencyBuilder(),
							new DeletedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
							new CreatedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
						])
				)
				.addService(
					'systemDiffBuilder',
					({ systemDiffDependencyBuilder, systemQueryHandler }) =>
						new DiffBuilder(systemDiffDependencyBuilder, systemQueryHandler)
				)
				.addService('systemDiffResponseBuilder', () => new DiffResponseBuilder())
				.addService(
					'systemDiffQueryResolver',
					({ systemQueryHandler, systemDiffBuilder, systemDiffResponseBuilder }) =>
						new DiffQueryResolver(systemQueryHandler, systemDiffBuilder, systemDiffResponseBuilder)
				)
				.addService(
					'systemResolvers',
					({ systemStagesQueryResolver, systemDiffQueryResolver }) =>
						new SystemResolverFactory(systemStagesQueryResolver, systemDiffQueryResolver)
				)
				.addService(
					'systemApolloServerFactory',
					({ systemResolvers }) => new SystemApolloServerFactory(systemResolvers.create())
				)
				.addService('systemApollo', ({ systemApolloServerFactory }) => systemApolloServerFactory.create())
				.build()

			return new Container.Builder({})
				.addService('project', () => container.get('project'))
				.addService('knexConnection', () => container.get('knexConnection'))
				.addService('knexDebugger', () => container.get('knexDebugger'))
				.addService('graphQlSchemaFactory', () => container.get('graphQlSchemaFactory'))
				.addService('systemApollo', () => container.get('systemApollo'))
				.addService('schemaVersionBuilder', () => container.get('schemaVersionBuilder'))
				.build()
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

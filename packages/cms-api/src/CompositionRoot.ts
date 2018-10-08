import * as knex from 'knex'
import * as Koa from 'koa'
import { ApolloServer } from 'apollo-server-koa'
import typeDefs from './tenant-api/schema/tenant.graphql'
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
import Project from './tenant-api/Project'
import AuthMiddlewareFactory from './http/AuthMiddlewareFactory'
import TenantMiddlewareFactory from './http/TenantMiddlewareFactory'
import ContentMiddlewareFactory from './http/ContentMiddlewareFactory'
import GraphQlSchemaBuilderFactory from './content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import { DatabaseCredentials } from './tenant-api/config'

class CompositionRoot {
	composeServer(tenantDbCredentials: DatabaseCredentials, projects: Array<Project>): Koa {
		const tenantContainer = this.createTenantContainer(tenantDbCredentials)
		const projectContainers = this.createProjectContainers(projects)

		const masterContainer = new Container.Builder({})
			.addService('tenantContainer', () => tenantContainer)
			.addService('projectContainers', () => projectContainers)

			.addService('authMiddleware', ({ tenantContainer }) =>
				new AuthMiddlewareFactory(tenantContainer.get('apiKeyManager')).create()
			)
			.addService('tenantMiddleware', ({ tenantContainer }) =>
				new TenantMiddlewareFactory(tenantContainer.get('apolloServer')).create()
			)
			.addService('contentMiddleware', ({ projectContainers }) =>
				new ContentMiddlewareFactory(projectContainers).create()
			)

			.addService('koa', ({ authMiddleware, tenantMiddleware, contentMiddleware }) => {
				const app = new Koa()
				app.use(authMiddleware)
				app.use(tenantMiddleware)
				app.use(contentMiddleware)

				return app
			})
			.build()

		return masterContainer.get('koa')
	}

	createProjectContainers(projects: Array<Project>) {
		return projects.map((project: Project) => {
			return new Container.Builder({})
				.addService('project', () => project)
				.addService('knexConnection', ({ project }) => {
					return knex({
						debug: true,
						client: 'pg',
						connection: {
							host: project.dbCredentials.host,
							port: project.dbCredentials.port,
							user: project.dbCredentials.user,
							password: project.dbCredentials.password,
							database: project.dbCredentials.database,
						},
					})
				})
				.addService('graphQlSchemaBuilderFactory', () => new GraphQlSchemaBuilderFactory())
				.build()
		})
	}

	private createTenantContainer(tenantDbCredentials: DatabaseCredentials) {
		return new Container.Builder({})

			.addService('knexConnection', () => {
				return new KnexConnection(
					knex({
						debug: false,
						client: 'pg',
						connection: tenantDbCredentials,
					}),
					'tenant'
				)
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
				({ queryHandler, knexConnection }) => new ApiKeyManager(queryHandler, knexConnection)
			)
			.addService(
				'signUpManager',
				({ queryHandler, knexConnection }) => new SignUpManager(queryHandler, knexConnection)
			)
			.addService('signInManager', ({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager))
			.addService(
				'projectMemberManager',
				({ queryHandler, knexConnection }) => new ProjectMemberManager(queryHandler, knexConnection)
			)

			.addService('meQueryResolver', ({ queryHandler }) => new MeQueryResolver(queryHandler))
			.addService(
				'signUpMutationResolver',
				({ signUpManager, queryHandler }) => new SignUpMutationResolver(signUpManager, queryHandler)
			)
			.addService(
				'signInMutationResolver',
				({ signInManager, queryHandler }) => new SignInMutationResolver(signInManager, queryHandler)
			)
			.addService(
				'addProjectMemberMutationResolver',
				({ queryHandler, knexConnection }) => new ProjectMemberManager(queryHandler, knexConnection)
			)

			.addService(
				'resolvers',
				({ meQueryResolver, signUpMutationResolver, signInMutationResolver, addProjectMemberMutationResolver }) => {
					return {
						Query: {
							me: meQueryResolver.me.bind(meQueryResolver),
						},
						Mutation: {
							signUp: signUpMutationResolver.signUp.bind(signUpMutationResolver),
							signIn: signInMutationResolver.signIn.bind(signInMutationResolver),
							addProjectMember: addProjectMemberMutationResolver.addProjectMember.bind(
								addProjectMemberMutationResolver
							),
						},
					}
				}
			)

			.addService('apolloServer', ({ resolvers }) => new ApolloServer({ typeDefs, resolvers }))
			.build()
	}
}

export default CompositionRoot

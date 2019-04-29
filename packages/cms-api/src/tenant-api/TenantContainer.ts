import { DatabaseCredentials } from '../config/config'
import QueryHandler from '../core/query/QueryHandler'
import DbQueryable from '../core/knex/DbQueryable'
import MeQueryResolver from './resolvers/query/MeQueryResolver'
import SignUpMutationResolver from './resolvers/mutation/SignUpMutationResolver'
import SignInMutationResolver from './resolvers/mutation/SignInMutationResolver'
import AddProjectMemberMutationResolver from './resolvers/mutation/AddProjectMemberMutationResolver'
import SetupMutationResolver from './resolvers/mutation/SetupMutationResolver'
import UpdateProjectMemberVariablesMutationResolver from './resolvers/mutation/UpdateProjectMemberVariablesMutationResolver'
import PermissionsFactory from './model/authorization/PermissionsFactory'
import TenantApolloServerFactory from '../http/TenantApolloServerFactory'
import Container from '../core/di/Container'
import ApiKeyManager from './model/service/ApiKeyManager'
import SignUpManager from './model/service/SignUpManager'
import SignInManager from './model/service/SignInManager'
import ProjectMemberManager from './model/service/ProjectMemberManager'
import ResolverFactory from './resolvers/ResolverFactory'
import AccessEvaluator from '../core/authorization/AccessEvalutator'
import Authorizator from '../core/authorization/Authorizator'
import { ApolloServer, Config } from 'apollo-server-koa'
import ProjectManager from './model/service/ProjectManager'
import CreateApiKeyMutationResolver from './resolvers/mutation/CreateApiKeyMutationResolver'
import Connection from '../core/knex/Connection'

interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	projectManager: ProjectManager
	apolloServer: ApolloServer
}

namespace TenantContainer {
	export class Factory {
		create(tenantDbCredentials: DatabaseCredentials): TenantContainer {
			return this.createBuilder(tenantDbCredentials)
				.build()
				.pick('apolloServer', 'apiKeyManager', 'projectMemberManager', 'projectManager')
		}

		createBuilder(tenantDbCredentials: DatabaseCredentials) {
			return new Container.Builder({})
				.addService('connection', (): Connection.ConnectionLike & Connection.ClientFactory => {
					return new Connection(tenantDbCredentials, {})
				})
				.addService('db', ({ connection }) => connection.createClient('tenant'))
				.addService('queryHandler', ({ db }) => {
					const handler = new QueryHandler(
						new DbQueryable(db, {
							get(): QueryHandler<DbQueryable> {
								return handler
							},
						})
					)

					return handler
				})
				.addService(
					'accessEvaluator',
					({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create())
				)
				.addService('authorizator', ({ accessEvaluator }) => new Authorizator.Default(accessEvaluator))

				.addService('apiKeyManager', ({ queryHandler, db }) => new ApiKeyManager(queryHandler, db))
				.addService('signUpManager', ({ queryHandler, db }) => new SignUpManager(queryHandler, db))
				.addService(
					'signInManager',
					({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager)
				)
				.addService('projectMemberManager', ({ queryHandler, db }) => new ProjectMemberManager(queryHandler, db))
				.addService('projectManager', ({ db }) => new ProjectManager(db))

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
					}) =>
						new ResolverFactory(
							meQueryResolver,
							signUpMutationResolver,
							signInMutationResolver,
							addProjectMemberMutationResolver,
							setupMutationResolver,
							updateProjectMemberVariablesMutationResolver,
							createApiKeyMutationResolver
						).create()
				)

				.addService('apolloServer', ({ resolvers, projectMemberManager, authorizator }) =>
					new TenantApolloServerFactory(resolvers, projectMemberManager, authorizator).create()
				)
		}
	}
}

export default TenantContainer

import { DatabaseCredentials } from '../config/config'
import QueryHandler from '../core/query/QueryHandler'
import DbQueryable from '../core/database/DbQueryable'
import MeQueryResolver from './resolvers/query/MeQueryResolver'
import CreateApiKeyMutationResolver from './resolvers/mutation/apiKey/CreateApiKeyMutationResolver'
import SignUpMutationResolver from './resolvers/mutation/person/SignUpMutationResolver'
import SignInMutationResolver from './resolvers/mutation/person/SignInMutationResolver'
import AddProjectMemberMutationResolver from './resolvers/mutation/projectMember/AddProjectMemberMutationResolver'
import UpdateProjectMemberMutationResolver from './resolvers/mutation/projectMember/UpdateProjectMemberMutationResolver'
import SetupMutationResolver from './resolvers/mutation/setup/SetupMutationResolver'
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
import { ApolloServer } from 'apollo-server-koa'
import ProjectManager from './model/service/ProjectManager'
import Connection from '../core/database/Connection'
import ChangePasswordMutationResolver from './resolvers/mutation/person/ChangePasswordMutationResolver'
import PasswordChangeManager from './model/service/PasswordChangeManager'
import SignOutMutationResolver from './resolvers/mutation/person/SignOutMutationResolver'
import RemoveProjectMemberMutationResolver from './resolvers/mutation/projectMember/RemoveProjectMemberMutationResolver'
import DisableApiKeyMutationResolver from './resolvers/mutation/apiKey/DisableApiKeyMutationResolver'
import { IdentityTypeResolver } from './resolvers/types/IdentityTypeResolver'
import MigrationsRunner from '../core/migrations/MigrationsRunner'
import MigrationFilesManager from '../migrations/MigrationFilesManager'

interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	apolloServer: ApolloServer
	dbMigrationsRunner: MigrationsRunner
}

namespace TenantContainer {
	export class Factory {
		create(tenantDbCredentials: DatabaseCredentials): TenantContainer {
			return this.createBuilder(tenantDbCredentials)
				.build()
				.pick(
					'apolloServer',
					'apiKeyManager',
					'projectMemberManager',
					'projectManager',
					'dbMigrationsRunner',
					'signUpManager',
				)
		}

		createBuilder(tenantDbCredentials: DatabaseCredentials) {
			return new Container.Builder({})
				.addService(
					'connection',
					(): Connection.ConnectionLike & Connection.ClientFactory => {
						return new Connection(tenantDbCredentials, {})
					},
				)
				.addService('db', ({ connection }) => connection.createClient('tenant'))
				.addService(
					'dbMigrationsRunner',
					() =>
						new MigrationsRunner(
							tenantDbCredentials,
							'tenant',
							MigrationFilesManager.createForEngine('tenant').directory,
						),
				)
				.addService('queryHandler', ({ db }) => {
					const handler = new QueryHandler(
						new DbQueryable(db, {
							get(): QueryHandler<DbQueryable> {
								return handler
							},
						}),
					)

					return handler
				})
				.addService(
					'accessEvaluator',
					({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()),
				)
				.addService('authorizator', ({ accessEvaluator }) => new Authorizator.Default(accessEvaluator))

				.addService('apiKeyManager', ({ queryHandler, db }) => new ApiKeyManager(queryHandler, db))
				.addService('signUpManager', ({ queryHandler, db }) => new SignUpManager(queryHandler, db))
				.addService('passwordChangeManager', ({ db }) => new PasswordChangeManager(db))
				.addService(
					'signInManager',
					({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager),
				)
				.addService('projectMemberManager', ({ queryHandler, db }) => new ProjectMemberManager(queryHandler, db))
				.addService('projectManager', ({ db }) => new ProjectManager(db))

				.addService('meQueryResolver', () => new MeQueryResolver())
				.addService(
					'signUpMutationResolver',
					({ signUpManager, apiKeyManager }) => new SignUpMutationResolver(signUpManager, apiKeyManager),
				)
				.addService('signInMutationResolver', ({ signInManager }) => new SignInMutationResolver(signInManager))
				.addService(
					'signOutMutationResolver',
					({ apiKeyManager, queryHandler }) => new SignOutMutationResolver(apiKeyManager, queryHandler),
				)
				.addService(
					'changePasswordMutationResolver',
					({ passwordChangeManager, queryHandler }) =>
						new ChangePasswordMutationResolver(passwordChangeManager, queryHandler),
				)
				.addService(
					'addProjectMemberMutationResolver',
					({ projectMemberManager }) => new AddProjectMemberMutationResolver(projectMemberManager),
				)
				.addService(
					'setupMutationResolver',
					({ signUpManager, apiKeyManager }) => new SetupMutationResolver(signUpManager, apiKeyManager),
				)
				.addService(
					'updateProjectMemberMutationResolver',
					({ projectMemberManager }) => new UpdateProjectMemberMutationResolver(projectMemberManager),
				)
				.addService(
					'removeProjectMemberMutationResolver',
					({ projectMemberManager }) => new RemoveProjectMemberMutationResolver(projectMemberManager),
				)
				.addService(
					'createApiKeyMutationResolver',
					({ apiKeyManager }) => new CreateApiKeyMutationResolver(apiKeyManager),
				)
				.addService(
					'disableApiKeyMutationResolver',
					({ apiKeyManager }) => new DisableApiKeyMutationResolver(apiKeyManager),
				)
				.addService('identityTypeResolver', ({ queryHandler }) => new IdentityTypeResolver(queryHandler))

				.addService('resolvers', container => new ResolverFactory(container).create())

				.addService('apolloServer', ({ resolvers, projectMemberManager, authorizator }) =>
					new TenantApolloServerFactory(resolvers, projectMemberManager, authorizator).create(),
				)
		}
	}
}

export default TenantContainer

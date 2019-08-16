import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials } from '../config/config'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import TenantApolloServerFactory from '../http/TenantApolloServerFactory'
import Container from '../core/di/Container'
import { ApolloServer } from 'apollo-server-koa'
import {
	AddProjectMemberMutationResolver,
	ApiKeyManager,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	MeQueryResolver,
	PasswordChangeManager,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	RemoveProjectMemberMutationResolver,
	ResolverFactory,
	SetupMutationResolver,
	SignInManager,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpManager,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from '@contember/engine-tenant-api'
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
				.addService('connection', (): Connection.ConnectionLike & Connection.ClientFactory => {
					return new Connection(tenantDbCredentials, {})
				})
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
						new DatabaseQueryable(db, {
							get(): QueryHandler<DatabaseQueryable> {
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
				.addService('projectManager', ({ queryHandler, db }) => new ProjectManager(queryHandler, db))

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
					({ projectMemberManager, projectManager }) =>
						new AddProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'setupMutationResolver',
					({ signUpManager, apiKeyManager }) => new SetupMutationResolver(signUpManager, apiKeyManager),
				)
				.addService(
					'updateProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new UpdateProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'removeProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new RemoveProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'createApiKeyMutationResolver',
					({ apiKeyManager, projectManager }) => new CreateApiKeyMutationResolver(apiKeyManager, projectManager),
				)
				.addService(
					'disableApiKeyMutationResolver',
					({ apiKeyManager }) => new DisableApiKeyMutationResolver(apiKeyManager),
				)
				.addService(
					'identityTypeResolver',
					({ queryHandler, projectMemberManager }) => new IdentityTypeResolver(queryHandler, projectMemberManager),
				)

				.addService('resolvers', container => new ResolverFactory(container).create())

				.addService('apolloServer', ({ resolvers, projectMemberManager, authorizator }) =>
					new TenantApolloServerFactory(resolvers, projectMemberManager, authorizator).create(),
				)
		}
	}
}

export default TenantContainer

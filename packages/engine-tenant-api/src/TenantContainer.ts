import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials, MigrationsRunner, Identity } from '@contember/engine-common'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AddProjectMemberMutationResolver,
	ApiKeyManager,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	createMigrationFilesManager,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	MeQueryResolver,
	PasswordChangeManager,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	RemoveProjectMemberMutationResolver,
	ResolverContextFactory,
	ResolverFactory,
	Schema,
	SetupMutationResolver,
	SignInManager,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpManager,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './'
import { CommandBus } from './model/commands/CommandBus'
import { Providers } from './model/providers'
import { ProjectTypeResolver } from './resolvers/types/ProjectTypeResolver'
import { ProjectQueryResolver } from './resolvers/query/ProjectQueryResolver'
import { ProjectVariablesResolver } from './model/type/Variables'
import { InviteMutationResolver } from './resolvers/mutation/person/InviteMutationResolver'
import { InviteManager } from './model/service/InviteManager'

interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	dbMigrationsRunner: MigrationsRunner
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
}

namespace TenantContainer {
	export class Factory {
		create(
			tenantDbCredentials: DatabaseCredentials,
			providers: Providers,
			projectVariablesResolver: ProjectVariablesResolver,
		): TenantContainer {
			return this.createBuilder(tenantDbCredentials, providers, projectVariablesResolver)
				.build()
				.pick(
					'apiKeyManager',
					'projectMemberManager',
					'projectManager',
					'dbMigrationsRunner',
					'signUpManager',
					'resolvers',
					'authorizator',
					'resolverContextFactory',
				)
		}

		createBuilder(
			tenantDbCredentials: DatabaseCredentials,
			providers: Providers,
			projectVariablesResolver: ProjectVariablesResolver,
		) {
			return new Builder({})
				.addService('connection', (): Connection.ConnectionLike & Connection.ClientFactory => {
					return new Connection(tenantDbCredentials, {})
				})
				.addService('db', ({ connection }) => connection.createClient('tenant'))
				.addService('providers', () => providers)
				.addService('commandBus', ({ db, providers }) => new CommandBus(db, providers))
				.addService(
					'dbMigrationsRunner',
					() => new MigrationsRunner(tenantDbCredentials, 'tenant', createMigrationFilesManager().directory),
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

				.addService('apiKeyManager', ({ queryHandler, commandBus }) => new ApiKeyManager(queryHandler, commandBus))
				.addService('signUpManager', ({ queryHandler, commandBus }) => new SignUpManager(queryHandler, commandBus))
				.addService('passwordChangeManager', ({ commandBus }) => new PasswordChangeManager(commandBus))
				.addService(
					'signInManager',
					({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager),
				)
				.addService(
					'projectMemberManager',
					({ queryHandler, commandBus }) => new ProjectMemberManager(queryHandler, commandBus),
				)
				.addService('projectManager', ({ queryHandler, commandBus }) => new ProjectManager(queryHandler, commandBus))
				.addService('inviteManager', ({ db, providers }) => new InviteManager(db, providers))

				.addService('meQueryResolver', () => new MeQueryResolver())
				.addService('projectQueryResolver', ({ projectManager }) => new ProjectQueryResolver(projectManager))
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
					'inviteMutationResolver',
					({ inviteManager, projectManager }) => new InviteMutationResolver(inviteManager, projectManager),
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
					({ queryHandler, projectMemberManager, projectManager }) =>
						new IdentityTypeResolver(queryHandler, projectMemberManager, projectManager),
				)
				.addService(
					'projectTypeResolver',
					({ projectMemberManager }) => new ProjectTypeResolver(projectMemberManager, projectVariablesResolver),
				)

				.addService(
					'resolverContextFactory',
					({ authorizator, projectMemberManager }) => new ResolverContextFactory(projectMemberManager, authorizator),
				)
				.addService('resolvers', container => new ResolverFactory(container).create())
		}
	}
}

export { TenantContainer }

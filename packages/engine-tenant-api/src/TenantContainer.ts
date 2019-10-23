import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials, Identity } from '@contember/engine-common'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	ApiKeyManager,
	PasswordChangeManager,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	SignInManager,
	SignUpManager,
} from './model'
import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	RemoveProjectMemberMutationResolver,
	SetupMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
	MeQueryResolver,
	ResolverContextFactory,
	ResolverFactory,
} from './resolvers'
import { CommandBus } from './model/commands/CommandBus'
import { Providers } from './model'
import { ProjectTypeResolver } from './resolvers/types/ProjectTypeResolver'
import { ProjectQueryResolver } from './resolvers/query/ProjectQueryResolver'
import { ProjectVariablesResolver } from './model/type'
import { InviteMutationResolver } from './resolvers/mutation/person/InviteMutationResolver'
import { InviteManager } from './model/service/InviteManager'
import { GraphQLError, GraphQLFormattedError } from 'graphql'
import { formatError } from './resolvers/ErrorFormatter'
import { ProjectMembersQueryResolver } from './resolvers/query/ProjectMembersQueryResolver'
import { PermissionContextFactory } from './model/authorization/PermissionContextFactory'
import { IdentityFactory } from './model/authorization/IdentityFactory'
import * as Schema from './schema'
import { createMigrationFilesManager } from './utils'

interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
	errorFormatter: (error: GraphQLError) => GraphQLFormattedError
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
					'signUpManager',
					'resolvers',
					'authorizator',
					'resolverContextFactory',
					'errorFormatter',
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
					({ queryHandler, apiKeyManager, providers }) => new SignInManager(queryHandler, apiKeyManager, providers),
				)
				.addService(
					'projectMemberManager',
					({ queryHandler, commandBus }) => new ProjectMemberManager(queryHandler, commandBus),
				)
				.addService('identityFactory', ({ projectMemberManager }) => new IdentityFactory(projectMemberManager))
				.addService(
					'permissionContextFactory',
					({ authorizator, identityFactory }) => new PermissionContextFactory(authorizator, identityFactory),
				)
				.addService('projectManager', ({ queryHandler, commandBus }) => new ProjectManager(queryHandler, commandBus))
				.addService('inviteManager', ({ db, providers }) => new InviteManager(db, providers))
				.addService(
					'identityTypeResolver',
					({ queryHandler, projectMemberManager, projectManager }) =>
						new IdentityTypeResolver(queryHandler, projectMemberManager, projectManager),
				)
				.addService(
					'projectTypeResolver',
					({ projectMemberManager }) => new ProjectTypeResolver(projectMemberManager, projectVariablesResolver),
				)
				.addService('meQueryResolver', () => new MeQueryResolver())
				.addService('projectQueryResolver', ({ projectManager }) => new ProjectQueryResolver(projectManager))
				.addService(
					'projectMembersQueryResolver',
					({ projectManager, projectMemberManager }) =>
						new ProjectMembersQueryResolver(projectManager, projectMemberManager),
				)
				.addService(
					'signUpMutationResolver',
					({ signUpManager, apiKeyManager }) => new SignUpMutationResolver(signUpManager, apiKeyManager),
				)
				.addService(
					'signInMutationResolver',
					({ signInManager, permissionContextFactory, identityTypeResolver }) =>
						new SignInMutationResolver(signInManager, identityTypeResolver, permissionContextFactory),
				)
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
					'resolverContextFactory',
					({ permissionContextFactory }) => new ResolverContextFactory(permissionContextFactory),
				)
				.addService('resolvers', container => new ResolverFactory(container).create())
				.addService('errorFormatter', () => formatError)
		}
	}
}

export { TenantContainer }

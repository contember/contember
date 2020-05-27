import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials, Identity } from '@contember/engine-common'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	ApiKeyManager,
	CommandBus,
	IdentityFactory,
	InviteManager,
	PasswordChangeManager,
	PermissionContextFactory,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	ProjectVariablesResolver,
	Providers,
	SignInManager,
	SignUpManager,
	UserMailer,
} from './model'
import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	InviteMutationResolver,
	MeQueryResolver,
	ProjectMembersQueryResolver,
	ProjectQueryResolver,
	ProjectTypeResolver,
	RemoveProjectMemberMutationResolver,
	ResolverContextFactory,
	ResolverFactory,
	SetupMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './resolvers'
import * as Schema from './schema'
import { createMailer, MailerOptions, TemplateRenderer } from './utils'

interface TenantContainer {
	connection: Connection
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
}

namespace TenantContainer {
	export class Factory {
		create(
			tenantDbCredentials: DatabaseCredentials,
			mailOptions: MailerOptions,
			providers: Providers,
			projectVariablesResolver: ProjectVariablesResolver,
		): TenantContainer {
			return this.createBuilder(tenantDbCredentials, mailOptions, providers, projectVariablesResolver)
				.build()
				.pick(
					'apiKeyManager',
					'projectMemberManager',
					'projectManager',
					'signUpManager',
					'resolvers',
					'authorizator',
					'resolverContextFactory',
					'connection',
				)
		}

		createBuilder(
			tenantDbCredentials: DatabaseCredentials,
			mailTransportParameters: MailerOptions,
			providers: Providers,
			projectVariablesResolver: ProjectVariablesResolver,
		) {
			return new Builder({})
				.addService('connection', () => new Connection(tenantDbCredentials, {}))
				.addService('db', ({ connection }) => connection.createClient('tenant'))
				.addService('mailer', () => createMailer(mailTransportParameters))
				.addService('templateRenderer', () => new TemplateRenderer())
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

				.addService('userMailer', ({ mailer, templateRenderer }) => new UserMailer(mailer, templateRenderer))

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
				.addService('inviteManager', ({ db, providers, userMailer }) => new InviteManager(db, providers, userMailer))
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
		}
	}
}

export { TenantContainer }

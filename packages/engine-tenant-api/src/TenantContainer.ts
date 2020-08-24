import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	ApiKeyManager,
	CommandBus,
	Identity,
	IdentityFactory,
	InviteManager,
	MailTemplateManager,
	PasswordChangeManager,
	PasswordResetManager,
	PermissionContextFactory,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	ProjectSchemaResolver,
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
	MailTemplateMutationResolver,
	MeQueryResolver,
	OtpMutationResolver,
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
import { ProjectScopeFactory } from './model/authorization/ProjectScopeFactory'
import { AclSchemaEvaluatorFactory } from './model/authorization/AclSchemaEvaluatorFactory'
import { MembershipValidator } from './model/service'
import { IdentityFetcher } from './bridges/system/IdentityFetcher'
import { OtpManager } from './model/service'
import { ResetPasswordMutationResolver } from './resolvers/mutation/person/ResetPasswordMutationResolver'

interface TenantContainer {
	connection: Connection.ConnectionLike & Connection.ClientFactory & Connection.PoolStatusProvider
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
	identityFetcher: IdentityFetcher
}

namespace TenantContainer {
	export class Factory {
		create(
			tenantDbCredentials: DatabaseCredentials,
			mailOptions: MailerOptions,
			providers: Providers,
			projectSchemaResolver: ProjectSchemaResolver,
		): TenantContainer {
			return this.createBuilder(tenantDbCredentials, mailOptions, providers, projectSchemaResolver)
				.build()
				.pick(
					'apiKeyManager',
					'projectMemberManager',
					'projectManager',
					'signUpManager',
					'resolvers',
					'authorizator',
					'resolverContextFactory',
					'identityFetcher',
					'connection',
				)
		}

		createBuilder(
			tenantDbCredentials: DatabaseCredentials,
			mailTransportParameters: MailerOptions,
			providers: Providers,
			projectSchemaResolver: ProjectSchemaResolver,
		) {
			return new Builder({})
				.addService(
					'connection',
					(): Connection.ConnectionLike & Connection.ClientFactory & Connection.PoolStatusProvider =>
						new Connection(tenantDbCredentials, {}),
				)
				.addService('db', ({ connection }) => connection.createClient('tenant', { module: 'tenant' }))
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

				.addService(
					'userMailer',
					({ mailer, templateRenderer, queryHandler }) => new UserMailer(mailer, templateRenderer, queryHandler),
				)

				.addService('apiKeyManager', ({ queryHandler, commandBus }) => new ApiKeyManager(queryHandler, commandBus))
				.addService('signUpManager', ({ queryHandler, commandBus }) => new SignUpManager(queryHandler, commandBus))
				.addService('passwordChangeManager', ({ commandBus }) => new PasswordChangeManager(commandBus))
				.addService(
					'projectMemberManager',
					({ queryHandler, commandBus }) => new ProjectMemberManager(queryHandler, commandBus),
				)
				.addService('identityFactory', ({ projectMemberManager }) => new IdentityFactory(projectMemberManager))
				.addService(
					'projectScopeFactory',
					() => new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()),
				)
				.addService(
					'permissionContextFactory',
					({ authorizator, identityFactory, projectScopeFactory }) =>
						new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory),
				)
				.addService('projectManager', ({ queryHandler, commandBus }) => new ProjectManager(queryHandler, commandBus))
				.addService(
					'passwordResetManager',
					({ commandBus, userMailer, permissionContextFactory, projectManager }) =>
						new PasswordResetManager(commandBus, userMailer, permissionContextFactory, projectManager),
				)
				.addService(
					'signInManager',
					({ queryHandler, apiKeyManager, providers }) => new SignInManager(queryHandler, apiKeyManager, providers),
				)
				.addService('membershipValidator', () => new MembershipValidator(projectSchemaResolver))
				.addService('inviteManager', ({ db, providers, userMailer }) => new InviteManager(db, providers, userMailer))
				.addService('otpManager', ({ commandBus }) => new OtpManager(commandBus))
				.addService('mailTemplateManager', ({ commandBus }) => new MailTemplateManager(commandBus))
				.addService('identityFetcher', ({ db }) => new IdentityFetcher(db))

				.addService(
					'identityTypeResolver',
					({ queryHandler, projectMemberManager, projectManager }) =>
						new IdentityTypeResolver(queryHandler, projectMemberManager, projectManager),
				)
				.addService(
					'projectTypeResolver',
					({ projectMemberManager }) => new ProjectTypeResolver(projectMemberManager, projectSchemaResolver),
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
					'resetPasswordMutationResolver',
					({ passwordResetManager, queryHandler }) =>
						new ResetPasswordMutationResolver(passwordResetManager, queryHandler),
				)
				.addService(
					'inviteMutationResolver',
					({ inviteManager, projectManager, membershipValidator }) =>
						new InviteMutationResolver(inviteManager, projectManager, membershipValidator),
				)
				.addService(
					'addProjectMemberMutationResolver',
					({ projectMemberManager, projectManager, membershipValidator }) =>
						new AddProjectMemberMutationResolver(projectMemberManager, projectManager, membershipValidator),
				)
				.addService(
					'setupMutationResolver',
					({ signUpManager, apiKeyManager }) => new SetupMutationResolver(signUpManager, apiKeyManager),
				)
				.addService(
					'updateProjectMemberMutationResolver',
					({ projectMemberManager, projectManager, membershipValidator }) =>
						new UpdateProjectMemberMutationResolver(projectMemberManager, projectManager, membershipValidator),
				)
				.addService(
					'removeProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new RemoveProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'createApiKeyMutationResolver',
					({ apiKeyManager, projectManager, membershipValidator }) =>
						new CreateApiKeyMutationResolver(apiKeyManager, projectManager, membershipValidator),
				)
				.addService(
					'disableApiKeyMutationResolver',
					({ apiKeyManager }) => new DisableApiKeyMutationResolver(apiKeyManager),
				)
				.addService(
					'otpMutationResolver',
					({ otpManager, queryHandler }) => new OtpMutationResolver(otpManager, queryHandler),
				)
				.addService(
					'mailTemplateMutationResolver',
					({ projectManager, mailTemplateManager }) =>
						new MailTemplateMutationResolver(projectManager, mailTemplateManager),
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

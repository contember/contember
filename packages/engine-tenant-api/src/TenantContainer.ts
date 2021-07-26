import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Connection, DatabaseCredentials, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { Builder } from '@contember/dic'
import {
	AclSchemaEvaluatorFactory,
	ApiKeyManager,
	CommandBus,
	Identity,
	IdentityFactory,
	IDPManager,
	IDPSignInManager,
	InviteManager,
	MailTemplateManager,
	MembershipValidator,
	OIDCProvider,
	OtpManager,
	PasswordChangeManager,
	PasswordResetManager,
	PermissionContextFactory,
	PermissionsFactory,
	ProjectInitializer,
	ProjectManager,
	ProjectMemberManager,
	ProjectSchemaResolver,
	ProjectScopeFactory,
	Providers,
	SecretsManager,
	SignInManager,
	SignUpManager,
	UserMailer,
} from './model'
import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	IDPMutationResolver,
	InviteMutationResolver,
	MailTemplateMutationResolver,
	MeQueryResolver,
	OtpMutationResolver,
	ProjectMembersQueryResolver,
	ProjectQueryResolver,
	ProjectTypeResolver,
	RemoveProjectMemberMutationResolver,
	ResetPasswordMutationResolver,
	ResolverContextFactory,
	ResolverFactory,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './resolvers'
import * as Schema from './schema'
import { createMailer, MailerOptions, TemplateRenderer } from './utils'
import { IdentityFetcher } from './bridges/system/IdentityFetcher'
import { SetProjectSecretMutationResolver } from './resolvers/mutation/project/SetProjectSecretMutationResolver'

export interface TenantContainer {
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

export interface TenantArgs {
	tenantDbCredentials: DatabaseCredentials
	mailOptions: MailerOptions
	providers: Providers
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer
}

export class TenantContainerFactory {
	create(args: TenantArgs): TenantContainer {
		return this.createBuilder(args)
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

	createBuilder(args: TenantArgs) {
		return new Builder({})
			.addService(
				'connection',
				(): Connection.ConnectionLike & Connection.ClientFactory & Connection.PoolStatusProvider =>
					new Connection(args.tenantDbCredentials, {}),
			)
			.addService('db', ({ connection }) => connection.createClient('tenant', { module: 'tenant' }))
			.addService('mailer', () => createMailer(args.mailOptions))
			.addService('projectSchemaResolver', () => args.projectSchemaResolver)
			.addService('templateRenderer', () => new TemplateRenderer())
			.addService('providers', () => args.providers)
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
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
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
				({ projectSchemaResolver }) => new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()),
			)
			.addService(
				'permissionContextFactory',
				({ authorizator, identityFactory, projectScopeFactory }) =>
					new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory),
			)
			.addService(
				'secretManager',
				({ commandBus, queryHandler, providers }) => new SecretsManager(commandBus, queryHandler, providers),
			)
			.addService(
				'projectManager',
				({ db, queryHandler, secretManager, providers }) =>
					new ProjectManager(db, queryHandler, secretManager, providers),
			)
			.addService(
				'passwordResetManager',
				({ commandBus, userMailer, permissionContextFactory, projectManager }) =>
					new PasswordResetManager(commandBus, userMailer, permissionContextFactory, projectManager),
			)
			.addService('idpManager', () => {
				const idpManager = new IDPManager()
				idpManager.registerProvider('oidc', new OIDCProvider())
				return idpManager
			})
			.addService(
				'idpSignInManager',
				({ queryHandler, apiKeyManager, idpManager }) => new IDPSignInManager(queryHandler, apiKeyManager, idpManager),
			)
			.addService(
				'signInManager',
				({ queryHandler, apiKeyManager, providers }) => new SignInManager(queryHandler, apiKeyManager, providers),
			)
			.addService('membershipValidator', ({ projectSchemaResolver }) => new MembershipValidator(projectSchemaResolver))
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
				({ projectMemberManager, projectSchemaResolver }) =>
					new ProjectTypeResolver(projectMemberManager, projectSchemaResolver),
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
				'idpMutationResolver',
				({ idpSignInManager, identityTypeResolver, permissionContextFactory }) =>
					new IDPMutationResolver(idpSignInManager, identityTypeResolver, permissionContextFactory),
			)
			.addService(
				'createProjectMutationResolver',
				({ projectManager }) => new CreateProjectMutationResolver(projectManager, args.projectInitializer),
			)
			.addService(
				'setProjectSecretMutationResolver',
				({ projectManager, secretManager }) => new SetProjectSecretMutationResolver(projectManager, secretManager),
			)
			.addService(
				'resolverContextFactory',
				({ permissionContextFactory }) => new ResolverContextFactory(permissionContextFactory),
			)
			.addService('resolvers', container => new ResolverFactory(container).create())
	}
}

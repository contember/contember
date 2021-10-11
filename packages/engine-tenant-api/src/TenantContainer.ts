import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Connection, DatabaseCredentials } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AclSchemaEvaluatorFactory,
	ApiKeyManager, ApiKeyService,
	DatabaseContext,
	Identity,
	IdentityFactory,
	IDPManager,
	IDPSignInManager,
	InviteManager,
	MailTemplateManager,
	MembershipValidator,
	OIDCProvider, OtpAuthenticator,
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
	SetProjectSecretMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
	UpdateProjectMutationResolver,
} from './resolvers'
import * as Schema from './schema'
import { createMailer, MailerOptions, TemplateRenderer } from './utils'
import { IdentityFetcher } from './bridges/system/IdentityFetcher'

type ConnectionType = Connection.ConnectionLike & Connection.ClientFactory & Connection.PoolStatusProvider

export interface TenantContainer {
	connection: ConnectionType
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
}

export interface TenantContainerArgs {
	providers: Providers
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer
}

export class TenantContainerFactory {
	constructor(private readonly tenantDbCredentials: DatabaseCredentials, private readonly mailOptions: MailerOptions) {}

	create(args: TenantContainerArgs): TenantContainer {
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

	createBuilder(args: TenantContainerArgs) {
		return new Builder({})
			.addService('connection', (): ConnectionType =>
				new Connection(this.tenantDbCredentials, {}))
			.addService('providers', () =>
				args.providers)
			.addService('db', ({ connection }) =>
				connection.createClient('tenant', { module: 'tenant' }))
			.addService('dbContext', ({ db, providers }) =>
				new DatabaseContext(db, providers))
			.addService('mailer', () =>
				createMailer(this.mailOptions))
			.addService('projectSchemaResolver', () =>
				args.projectSchemaResolver)
			.addService('templateRenderer', () =>
				new TemplateRenderer())
			.addService('accessEvaluator', ({}) =>
				new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }) =>
				new Authorizator.Default(accessEvaluator))
			.addService('userMailer', ({ mailer, templateRenderer, dbContext }) =>
				new UserMailer(mailer, templateRenderer, dbContext))
			.addService('apiKeyService', () =>
				new ApiKeyService())
			.addService('apiKeyManager', ({ dbContext, apiKeyService }) =>
				new ApiKeyManager(dbContext, apiKeyService))
			.addService('signUpManager', ({ dbContext }) =>
				new SignUpManager(dbContext))
			.addService('passwordChangeManager', ({ dbContext, providers }) =>
				new PasswordChangeManager(dbContext, providers))
			.addService('projectMemberManager', ({ dbContext }) =>
				new ProjectMemberManager(dbContext))
			.addService('identityFactory', ({ projectMemberManager }) =>
				new IdentityFactory(projectMemberManager))
			.addService('projectScopeFactory', ({ projectSchemaResolver }) =>
				new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()))
			.addService('permissionContextFactory', ({ authorizator, identityFactory, projectScopeFactory }) =>
				new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory))
			.addService('secretManager', ({ dbContext, providers }) =>
				new SecretsManager(dbContext, providers))
			.addService('projectManager', ({ dbContext, secretManager, apiKeyService }) =>
				new ProjectManager(dbContext, secretManager, args.projectInitializer, apiKeyService))
			.addService('passwordResetManager', ({ dbContext, userMailer, permissionContextFactory, projectManager }) =>
				new PasswordResetManager(dbContext, userMailer, permissionContextFactory, projectManager),
			)
			.addService('idpManager', () => {
				const idpManager = new IDPManager()
				idpManager.registerProvider('oidc', new OIDCProvider())
				return idpManager
			})
			.addService('idpSignInManager', ({ dbContext, apiKeyManager, idpManager }) =>
				new IDPSignInManager(dbContext, apiKeyManager, idpManager))
			.addService('otpAuthenticator', ({ providers }) =>
				new OtpAuthenticator(providers))
			.addService('signInManager', ({ apiKeyManager, providers, dbContext, otpAuthenticator }) =>
				new SignInManager(dbContext, apiKeyManager, providers, otpAuthenticator))
			.addService('membershipValidator', ({ projectSchemaResolver }) =>
				new MembershipValidator(projectSchemaResolver))
			.addService('inviteManager', ({ dbContext, providers, userMailer }) =>
				new InviteManager(dbContext, providers, userMailer))
			.addService('otpManager', ({ dbContext, otpAuthenticator }) =>
				new OtpManager(dbContext, otpAuthenticator))
			.addService('mailTemplateManager', ({ dbContext }) =>
				new MailTemplateManager(dbContext))
			.addService('identityTypeResolver', ({ dbContext, projectMemberManager, projectManager }) =>
				new IdentityTypeResolver(dbContext, projectMemberManager, projectManager))
			.addService('projectTypeResolver', ({ projectMemberManager, projectSchemaResolver }) =>
				new ProjectTypeResolver(projectMemberManager, projectSchemaResolver))
			.addService('meQueryResolver', () =>
				new MeQueryResolver())
			.addService('projectQueryResolver', ({ projectManager }) =>
				new ProjectQueryResolver(projectManager))
			.addService('projectMembersQueryResolver', ({ projectManager, projectMemberManager }) =>
				new ProjectMembersQueryResolver(projectManager, projectMemberManager))
			.addService('signUpMutationResolver', ({ signUpManager, apiKeyManager }) =>
				new SignUpMutationResolver(signUpManager, apiKeyManager))
			.addService('signInMutationResolver', ({ signInManager, permissionContextFactory, identityTypeResolver }) =>
				new SignInMutationResolver(signInManager, identityTypeResolver, permissionContextFactory))
			.addService('signOutMutationResolver', ({ apiKeyManager, dbContext }) =>
				new SignOutMutationResolver(apiKeyManager, dbContext))
			.addService('changePasswordMutationResolver', ({ passwordChangeManager, dbContext }) =>
				new ChangePasswordMutationResolver(passwordChangeManager, dbContext))
			.addService('resetPasswordMutationResolver', ({ passwordResetManager, dbContext }) =>
				new ResetPasswordMutationResolver(passwordResetManager, dbContext))
			.addService('inviteMutationResolver', ({ inviteManager, projectManager, membershipValidator }) =>
				new InviteMutationResolver(inviteManager, projectManager, membershipValidator))
			.addService('addProjectMemberMutationResolver', ({ projectMemberManager, projectManager, membershipValidator }) =>
				new AddProjectMemberMutationResolver(projectMemberManager, projectManager, membershipValidator))
			.addService('updateProjectMemberMutationResolver', ({ projectMemberManager, projectManager, membershipValidator }) =>
				new UpdateProjectMemberMutationResolver(projectMemberManager, projectManager, membershipValidator))
			.addService('removeProjectMemberMutationResolver', ({ projectMemberManager, projectManager }) =>
				new RemoveProjectMemberMutationResolver(projectMemberManager, projectManager))
			.addService('createApiKeyMutationResolver', ({ apiKeyManager, projectManager, membershipValidator }) =>
				new CreateApiKeyMutationResolver(apiKeyManager, projectManager, membershipValidator))
			.addService('disableApiKeyMutationResolver', ({ apiKeyManager }) =>
				new DisableApiKeyMutationResolver(apiKeyManager))
			.addService('otpMutationResolver', ({ otpManager, dbContext }) =>
				new OtpMutationResolver(otpManager, dbContext))
			.addService('mailTemplateMutationResolver', ({ projectManager, mailTemplateManager }) =>
				new MailTemplateMutationResolver(projectManager, mailTemplateManager))
			.addService('idpMutationResolver', ({ idpSignInManager, identityTypeResolver, permissionContextFactory }) =>
				new IDPMutationResolver(idpSignInManager, identityTypeResolver, permissionContextFactory))
			.addService('createProjectMutationResolver', ({ projectManager }) =>
				new CreateProjectMutationResolver(projectManager))
			.addService('updateProjectMutationResolver', ({ projectManager }) =>
				new UpdateProjectMutationResolver(projectManager))
			.addService('setProjectSecretMutationResolver', ({ projectManager, secretManager }) =>
				new SetProjectSecretMutationResolver(projectManager, secretManager))
			.addService('resolverContextFactory', ({ permissionContextFactory }) =>
				new ResolverContextFactory(permissionContextFactory))
			.addService('resolvers', container =>
				new ResolverFactory(container).create())
	}
}

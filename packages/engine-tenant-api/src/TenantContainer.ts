import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Connection, DatabaseCredentials } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AclSchemaEvaluatorFactory,
	ApiKeyManager,
	ApiKeyService,
	DatabaseContextFactory,
	Identity,
	IdentityFactory,
	IDPManager,
	IDPSignInManager,
	InviteManager,
	MailTemplateManager,
	MembershipValidator,
	OIDCProvider,
	OtpAuthenticator,
	OtpManager,
	PasswordChangeManager,
	PasswordResetManager,
	PermissionContextFactory,
	PermissionsFactory,
	ProjectGroupProvider,
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
import { MigrationsRunnerFactory, TenantCredentials } from './migrations'
import { IdentityFetcher } from './bridges/system/IdentityFetcher'

export type ConnectionType = Connection.ConnectionLike & Connection.ClientFactory & Connection.PoolStatusProvider

export interface TenantContainer {
	connection: ConnectionType
	projectGroupProvider: ProjectGroupProvider
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: ResolverContextFactory
	authorizator: Authorizator<Identity>
	migrationsRunnerFactory: MigrationsRunnerFactory
	identityFetcher: IdentityFetcher
}

export interface TenantContainerArgs {
	providers: Providers
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer
}

export class TenantContainerFactory {
	constructor(
		private readonly tenantDbCredentials: DatabaseCredentials,
		private readonly mailOptions: MailerOptions,
		private readonly tenantCredentials: TenantCredentials,
	) {}

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
				'connection',
				'projectGroupProvider',
				'migrationsRunnerFactory',
				'identityFetcher',
			)
	}

	createBuilder(args: TenantContainerArgs) {
		return new Builder({})
			.addService('connection', (): ConnectionType =>
				new Connection(this.tenantDbCredentials, {}))
			.addService('providers', () =>
				args.providers)
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
			.addService('userMailer', ({ mailer, templateRenderer }) =>
				new UserMailer(mailer, templateRenderer))
			.addService('apiKeyService', () =>
				new ApiKeyService())
			.addService('apiKeyManager', ({ apiKeyService }) =>
				new ApiKeyManager(apiKeyService))
			.addService('signUpManager', () =>
				new SignUpManager())
			.addService('passwordChangeManager', ({ providers }) =>
				new PasswordChangeManager(providers))
			.addService('projectMemberManager', () =>
				new ProjectMemberManager())
			.addService('identityFactory', ({ projectMemberManager }) =>
				new IdentityFactory(projectMemberManager))
			.addService('projectScopeFactory', ({ projectSchemaResolver }) =>
				new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()))
			.addService('permissionContextFactory', ({ authorizator, identityFactory, projectScopeFactory }) =>
				new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory))
			.addService('secretManager', ({ providers }) =>
				new SecretsManager(providers))
			.addService('projectManager', ({ secretManager, apiKeyService }) =>
				new ProjectManager(secretManager, args.projectInitializer, apiKeyService))
			.addService('passwordResetManager', ({ userMailer, projectManager }) =>
				new PasswordResetManager(userMailer, projectManager))
			.addService('idpManager', () => {
				const idpManager = new IDPManager()
				idpManager.registerProvider('oidc', new OIDCProvider())
				return idpManager
			})
			.addService('idpSignInManager', ({ apiKeyManager, idpManager }) =>
				new IDPSignInManager(apiKeyManager, idpManager))
			.addService('otpAuthenticator', ({ providers }) =>
				new OtpAuthenticator(providers))
			.addService('signInManager', ({ apiKeyManager, providers, otpAuthenticator }) =>
				new SignInManager(apiKeyManager, providers, otpAuthenticator))
			.addService('membershipValidator', ({ projectSchemaResolver }) =>
				new MembershipValidator(projectSchemaResolver))
			.addService('inviteManager', ({ providers, userMailer }) =>
				new InviteManager(providers, userMailer))
			.addService('otpManager', ({ otpAuthenticator }) =>
				new OtpManager(otpAuthenticator))
			.addService('mailTemplateManager', () =>
				new MailTemplateManager())
			.addService('identityFetcher', () =>
				new IdentityFetcher())
			.addService('identityTypeResolver', ({ projectMemberManager, projectManager }) =>
				new IdentityTypeResolver(projectMemberManager, projectManager))
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
			.addService('signOutMutationResolver', ({ apiKeyManager }) =>
				new SignOutMutationResolver(apiKeyManager))
			.addService('changePasswordMutationResolver', ({ passwordChangeManager }) =>
				new ChangePasswordMutationResolver(passwordChangeManager))
			.addService('resetPasswordMutationResolver', ({ passwordResetManager, permissionContextFactory }) =>
				new ResetPasswordMutationResolver(passwordResetManager, permissionContextFactory))
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
			.addService('otpMutationResolver', ({ otpManager }) =>
				new OtpMutationResolver(otpManager))
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
			.addService('db', ({ connection }) =>
				connection.createClient('tenant', { module: 'tenant' }))
			.addService('databaseContextFactory', ({ db, providers }) =>
				new DatabaseContextFactory(db, providers))
			.addService('migrationsRunnerFactory', ({ providers }) =>
				new MigrationsRunnerFactory(this.tenantDbCredentials, this.tenantCredentials, providers))
			.addService('projectGroupProvider', ({ databaseContextFactory, migrationsRunnerFactory }) =>
				new ProjectGroupProvider(databaseContextFactory, migrationsRunnerFactory))
			.addService('resolverContextFactory', ({ permissionContextFactory }) =>
				new ResolverContextFactory(permissionContextFactory))
			.addService('resolvers', container =>
				new ResolverFactory(container).create())
	}
}

import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Connection, DatabaseConfig } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AclSchemaAccessNodeFactory,
	ApiKeyManager,
	ApiKeyService,
	AppleProvider,
	DatabaseContext,
	EmailValidator,
	FacebookProvider,
	Identity,
	IdentityFactory,
	IDPHandlerRegistry,
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
	PersonAccessManager,
	PersonManager,
	ProjectInitializer,
	ProjectManager,
	ProjectMemberManager,
	ProjectSchemaResolver,
	ProjectScopeFactory,
	Providers,
	RolesManager,
	SecretsManager,
	SignInManager,
	SignUpManager,
	UserMailer,
} from './model'
import {
	AddIDPMutationResolver,
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	ChangeProfileMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	DisableIDPMutationResolver,
	EnableIDPMutationResolver,
	IdentityGlobalRolesMutationResolver,
	IdentityTypeResolver,
	IDPMutationResolver,
	InviteMutationResolver,
	MailTemplateMutationResolver,
	MeQueryResolver,
	OtpMutationResolver,
	PersonQueryResolver,
	ProjectMembersQueryResolver,
	ProjectQueryResolver,
	ProjectTypeResolver,
	RemoveProjectMemberMutationResolver,
	ResetPasswordMutationResolver,
	ResolverFactory,
	SetProjectSecretMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	TenantResolverContextFactory,
	UpdateProjectMemberMutationResolver,
	UpdateProjectMutationResolver,
} from './resolvers'
import * as Schema from './schema'
import { createMailer, MailerOptions, TemplateRenderer } from './utils'
import { IdentityFetcher } from './bridges/system/IdentityFetcher'
import { SignInResponseFactory } from './resolvers/responseHelpers/SignInResponseFactory'
import { IDPQueryResolver } from './resolvers/query/IDPQueryResolver'
import { UpdateIDPMutationResolver } from './resolvers/mutation/idp/UpdateIDPMutationResolver'
import { TenantCredentials, TenantMigrationsRunner } from './migrations'
import { DisablePersonMutationResolver } from './resolvers/mutation/person/DisablePersonMutationResolver'
import { MailTemplateQueryResolver } from './resolvers/query/MailTemplateQueryResolver'

export interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	resolvers: Schema.Resolvers
	resolverContextFactory: TenantResolverContextFactory
	authorizator: Authorizator<Identity>
	identityFetcher: IdentityFetcher
	databaseContext: DatabaseContext
	readDatabaseContext: DatabaseContext
	migrationsRunner: TenantMigrationsRunner
	connection: Connection.ConnectionType
	readConnection: Connection.ConnectionType
}

export interface TenantContainerArgs {
	connection: Connection.ConnectionType
	readConnection: Connection.ConnectionType
	dbCredentials: DatabaseConfig
	mailOptions: MailerOptions
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer
	tenantCredentials: TenantCredentials
	cryptoProviders: Pick<Providers, 'encrypt' | 'decrypt'>
}

export class TenantContainerFactory {
	constructor(
		private readonly providers: Omit<Providers, 'encrypt' | 'decrypt'>,
	) { }

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
				'databaseContext',
				'readDatabaseContext',
				'migrationsRunner',
				'connection',
				'readConnection',
			)
	}

	createBuilder(args: TenantContainerArgs) {
		return new Builder({})
			.addService('providers', () =>
				({ ...this.providers, ...args.cryptoProviders }))
			.addService('mailer', () =>
				createMailer(args.mailOptions))
			.addService('projectSchemaResolver', () =>
				args.projectSchemaResolver)
			.addService('templateRenderer', () =>
				new TemplateRenderer())
			.addService('accessEvaluator', ({ }) =>
				new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }) =>
				new Authorizator.Default(accessEvaluator))
			.addService('userMailer', ({ mailer, templateRenderer }) =>
				new UserMailer(mailer, templateRenderer))
			.addService('apiKeyService', () =>
				new ApiKeyService())
			.addService('apiKeyManager', ({ apiKeyService }) =>
				new ApiKeyManager(apiKeyService))
			.addService('emailValidator', () =>
				new EmailValidator())
			.addService('signUpManager', ({ emailValidator }) =>
				new SignUpManager(emailValidator))
			.addService('passwordChangeManager', ({ providers }) =>
				new PasswordChangeManager(providers))
			.addService('projectMemberManager', () =>
				new ProjectMemberManager())
			.addService('identityFactory', ({ projectMemberManager }) =>
				new IdentityFactory(projectMemberManager))
			.addService('projectScopeFactory', () =>
				new ProjectScopeFactory(new AclSchemaAccessNodeFactory()))
			.addService('permissionContextFactory', ({ authorizator, identityFactory, projectScopeFactory, projectSchemaResolver }) =>
				new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory, projectSchemaResolver))
			.addService('secretManager', ({ providers }) =>
				new SecretsManager(providers))
			.addService('projectManager', ({ secretManager, apiKeyService }) =>
				new ProjectManager(secretManager, args.projectInitializer, apiKeyService))
			.addService('personAccessManager', ({ apiKeyManager }) =>
				new PersonAccessManager(apiKeyManager))
			.addService('personManager', ({ emailValidator }) =>
				new PersonManager(emailValidator))
			.addService('passwordResetManager', ({ userMailer, projectManager }) =>
				new PasswordResetManager(userMailer, projectManager))
			.addService('idpRegistry', () => {
				const idpRegistry = new IDPHandlerRegistry()
				idpRegistry.registerHandler('oidc', new OIDCProvider())
				idpRegistry.registerHandler('facebook', new FacebookProvider())
				idpRegistry.registerHandler('apple', new AppleProvider())
				return idpRegistry
			})
			.addService('idpSignInManager', ({ apiKeyManager, idpRegistry }) =>
				new IDPSignInManager(apiKeyManager, idpRegistry))
			.addService('idpManager', ({ idpRegistry }) =>
				new IDPManager(idpRegistry))
			.addService('otpAuthenticator', ({ providers }) =>
				new OtpAuthenticator(providers))
			.addService('signInManager', ({ apiKeyManager, providers, otpAuthenticator }) =>
				new SignInManager(apiKeyManager, providers, otpAuthenticator))
			.addService('membershipValidator', ({ projectSchemaResolver }) =>
				new MembershipValidator(projectSchemaResolver))
			.addService('inviteManager', ({ providers, userMailer, projectSchemaResolver }) =>
				new InviteManager(providers, userMailer, projectSchemaResolver))
			.addService('otpManager', ({ otpAuthenticator }) =>
				new OtpManager(otpAuthenticator))
			.addService('mailTemplateManager', () =>
				new MailTemplateManager())
			.addService('rolesManager', () =>
				new RolesManager())

			.addService('identityTypeResolver', ({ projectMemberManager, projectManager, permissionContextFactory }) =>
				new IdentityTypeResolver(projectMemberManager, projectManager, permissionContextFactory))
			.addService('projectTypeResolver', ({ projectMemberManager, projectSchemaResolver }) =>
				new ProjectTypeResolver(projectMemberManager, projectSchemaResolver))
			.addService('signInResponseFactory', ({ permissionContextFactory, identityTypeResolver }) =>
				new SignInResponseFactory(permissionContextFactory, identityTypeResolver))
			.addService('meQueryResolver', () =>
				new MeQueryResolver())
			.addService('personQueryResolver', ({ personManager }) =>
				new PersonQueryResolver(personManager))
			.addService('idpQueryResolver', ({ idpManager }) =>
				new IDPQueryResolver(idpManager))
			.addService('projectQueryResolver', ({ projectManager }) =>
				new ProjectQueryResolver(projectManager))
			.addService('projectMembersQueryResolver', ({ projectManager, projectMemberManager }) =>
				new ProjectMembersQueryResolver(projectManager, projectMemberManager))
			.addService('mailTemplateQueryResolver', () =>
				new MailTemplateQueryResolver())
			.addService('signUpMutationResolver', ({ signUpManager, apiKeyManager }) =>
				new SignUpMutationResolver(signUpManager, apiKeyManager))
			.addService('signInMutationResolver', ({ signInManager, signInResponseFactory }) =>
				new SignInMutationResolver(signInManager, signInResponseFactory))
			.addService('signOutMutationResolver', ({ apiKeyManager }) =>
				new SignOutMutationResolver(apiKeyManager))
			.addService('changeProfileMutationResolver', ({ personManager }) =>
				new ChangeProfileMutationResolver(personManager))
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
			.addService('idpMutationResolver', ({ idpSignInManager, signInResponseFactory }) =>
				new IDPMutationResolver(idpSignInManager, signInResponseFactory))
			.addService('registerIdpMutationResolver', ({ idpManager }) =>
				new AddIDPMutationResolver(idpManager))
			.addService('updateIdpMutationResolver', ({ idpManager }) =>
				new UpdateIDPMutationResolver(idpManager))
			.addService('disableIdpMutationResolver', ({ idpManager }) =>
				new DisableIDPMutationResolver(idpManager))
			.addService('enableIdpMutationResolver', ({ idpManager }) =>
				new EnableIDPMutationResolver(idpManager))
			.addService('createProjectMutationResolver', ({ projectManager }) =>
				new CreateProjectMutationResolver(projectManager))
			.addService('disablePersonMutationResolver', ({ personAccessManager, personManager }) =>
				new DisablePersonMutationResolver(personAccessManager, personManager))
			.addService('updateProjectMutationResolver', ({ projectManager }) =>
				new UpdateProjectMutationResolver(projectManager))
			.addService('setProjectSecretMutationResolver', ({ projectManager, secretManager }) =>
				new SetProjectSecretMutationResolver(projectManager, secretManager))
			.addService('identityGlobalRolesMutationResolver', ({ rolesManager }) =>
				new IdentityGlobalRolesMutationResolver(rolesManager))
			.addService('resolverContextFactory', ({ permissionContextFactory }) =>
				new TenantResolverContextFactory(permissionContextFactory))
			.addService('resolvers', container =>
				new ResolverFactory(container).create())
			.addService('connection', () =>
				args.connection)
			.addService('readConnection', () =>
				args.readConnection)
			.addService('databaseContext', ({ connection, providers }) =>
				new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers))
			.addService('readDatabaseContext', ({ readConnection, providers }) =>
				new DatabaseContext(readConnection.createClient('tenant', { module: 'tenant' }), providers))
			.addService('identityFetcher', ({ databaseContext }) =>
				new IdentityFetcher(databaseContext.client))
			.addService('migrationsRunner', ({ providers }) =>
				new TenantMigrationsRunner(args.dbCredentials, 'tenant', args.tenantCredentials, providers))
	}
}

import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Connection, DatabaseConfig } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AclSchemaAccessNodeFactory,
	ApiKeyManager,
	ApiKeyService,
	AppleProvider,
	AuthPolicyManager,
	AuthPolicyResolver,
	BackchannelLogoutManager,
	BackupCodeManager,
	CaptchaValidator,
	DatabaseContext,
	EmailChangeManager,
	EmailOtpManager,
	EmailValidator,
	EmailVerificationManager,
	FacebookProvider,
	HCaptchaProvider,
	Identity,
	IdentityFactory,
	IDPClaimSyncService,
	IDPHandlerRegistry,
	IDPManager,
	IdpSessionRevalidator,
	IDPSignInManager,
	InviteManager,
	LoginRiskAnalyzer,
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
	PersonIdentityProviderManager,
	PersonManager,
	ProjectInitializer,
	ProjectManager,
	ProjectMemberManager,
	ProjectSchemaResolver,
	ProjectScopeFactory,
	Providers,
	RateLimiter,
	RecaptchaV3Provider,
	RolesManager,
	SecretsManager,
	SignInManager,
	SignOutManager,
	SignUpManager,
	TurnstileProvider,
	UnpersistedApiKeyManager,
	UserMailer,
} from './model/index.js'
import { HibpChecker, HttpHibpChecker, NoopHibpChecker } from './model/service/HibpChecker.js'
import {
	AddIDPMutationResolver,
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	ChangeProfileMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	DisableIDPMutationResolver,
	DisconnectMyIdentityProviderMutationResolver,
	EmailOtpMutationResolver,
	EmailVerificationMutationResolver,
	EnableIDPMutationResolver,
	IdentityGlobalRolesMutationResolver,
	IdentityTypeResolver,
	IDPMutationResolver,
	InviteMutationResolver,
	MailTemplateMutationResolver,
	MeQueryResolver,
	OtpMutationResolver,
	PersonQueryResolver,
	PersonTypeResolver,
	ProjectMembersQueryResolver,
	ProjectQueryResolver,
	ProjectTypeResolver,
	RegenerateBackupCodesMutationResolver,
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
} from './resolvers/index.js'
import * as Schema from './schema/index.js'
import { createMailer, MailerOptions, TemplateRenderer } from './utils/index.js'
import { IdentityFetcher } from './bridges/system/IdentityFetcher.js'
import { SignInResponseFactory } from './resolvers/responseHelpers/SignInResponseFactory.js'
import { IDPQueryResolver } from './resolvers/query/IDPQueryResolver.js'
import { UpdateIDPMutationResolver } from './resolvers/mutation/idp/UpdateIDPMutationResolver.js'
import { TenantCredentials, TenantMigrationsRunner } from './migrations/index.js'
import { DisablePersonMutationResolver } from './resolvers/mutation/person/DisablePersonMutationResolver.js'
import { ForceSignOutMutationResolver } from './resolvers/mutation/person/ForceSignOutMutationResolver.js'
import { RevokeSessionMutationResolver } from './resolvers/mutation/person/RevokeSessionMutationResolver.js'
import { MailTemplateQueryResolver } from './resolvers/query/MailTemplateQueryResolver.js'
import { ConfigurationManager } from './model/service/ConfigurationManager.js'
import { ConfigurationMutationResolver } from './resolvers/mutation/configuration/ConfigurationMutationResolver.js'
import { ConfigurationQueryResolver } from './resolvers/query/ConfigurationQueryResolver.js'
import { AuthPolicyMutationResolver } from './resolvers/mutation/configuration/AuthPolicyMutationResolver.js'
import { AuthPolicyQueryResolver } from './resolvers/query/AuthPolicyQueryResolver.js'
import { ResetPersonMfaMutationResolver } from './resolvers/mutation/person/ResetPersonMfaMutationResolver.js'
import { AuthLogQueryResolver } from './resolvers/query/AuthLogQueryResolver.js'
import { ApiKeyQueryResolver } from './resolvers/query/ApiKeyQueryResolver.js'
import { PasswordlessMutationResolver } from './resolvers/mutation/person/PasswordlessMutationResolver.js'
import { PasswordlessSignInManager } from './model/service/PasswordlessSignInManager.js'
import { TogglePasswordlessMutationResolver } from './resolvers/mutation/person/TogglePasswordlessMutationResolver.js'
import { PasswordStrengthValidator } from './model/service/PasswordStrengthValidator.js'
import { AuthLogService } from './model/service/AuthLogService.js'

export interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	backchannelLogoutManager: BackchannelLogoutManager
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
	cryptoProviders: Pick<Providers, 'encrypt' | 'decrypt' | 'encryptionEnabled'>
}

export class TenantContainerFactory {
	constructor(
		private readonly providers: Omit<Providers, 'encrypt' | 'decrypt' | 'encryptionEnabled'>,
	) {}

	create(args: TenantContainerArgs): TenantContainer {
		return this.createBuilder(args)
			.build()
			.pick(
				'apiKeyManager',
				'backchannelLogoutManager',
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
			.addService('providers', () => ({ ...this.providers, ...args.cryptoProviders }))
			.addService('mailer', () => createMailer(args.mailOptions))
			.addService('projectSchemaResolver', () => args.projectSchemaResolver)
			.addService('templateRenderer', () => new TemplateRenderer())
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }) => new Authorizator.Default(accessEvaluator))
			.addService('userMailer', ({ mailer, templateRenderer }) => new UserMailer(mailer, templateRenderer))
			.addService('apiKeyService', () => new ApiKeyService())
			.addService('authPolicyResolver', () => new AuthPolicyResolver())
			.addService('authLogService', () => new AuthLogService())
			.addService('loginRiskAnalyzer', ({ providers }) => new LoginRiskAnalyzer(providers.hash))
			.addService('idpRegistry', () => {
				const idpRegistry = new IDPHandlerRegistry()
				idpRegistry.registerHandler('oidc', new OIDCProvider())
				idpRegistry.registerHandler('facebook', new FacebookProvider())
				idpRegistry.registerHandler('apple', new AppleProvider())
				return idpRegistry
			})
			.addService('idpClaimSyncService', ({ projectSchemaResolver }) => new IDPClaimSyncService(projectSchemaResolver))
			.addService('idpSessionRevalidator', ({ idpRegistry, idpClaimSyncService }) => new IdpSessionRevalidator(idpRegistry, idpClaimSyncService))
			.addService('backchannelLogoutManager', ({ idpRegistry }) => new BackchannelLogoutManager(idpRegistry))
			.addService('unpersistedApiKeyManager', () =>
				UnpersistedApiKeyManager.createForRootTokens({
					tokens: args.tenantCredentials.rootTokens,
					tokenHashes: args.tenantCredentials.rootTokenHashes,
				}))
			.addService(
				'apiKeyManager',
				({ apiKeyService, authPolicyResolver, authLogService, unpersistedApiKeyManager, idpSessionRevalidator }) =>
					new ApiKeyManager(apiKeyService, authPolicyResolver, authLogService, unpersistedApiKeyManager, idpSessionRevalidator),
			)
			.addService('signOutManager', ({ apiKeyManager, idpRegistry }) => new SignOutManager(apiKeyManager, idpRegistry))
			.addService('emailValidator', () => new EmailValidator())
			.addService('hibpChecker', (): HibpChecker => new HttpHibpChecker())
			.addService('noopHibpChecker', (): HibpChecker => new NoopHibpChecker())
			.addService('passwordStrengthValidator', ({ hibpChecker }) => new PasswordStrengthValidator(hibpChecker))
			.addService('captchaValidator', () =>
				new CaptchaValidator({
					turnstile: new TurnstileProvider(),
					hcaptcha: new HCaptchaProvider(),
					recaptchaV3: new RecaptchaV3Provider(),
				}))
			.addService('rateLimiter', ({ providers }) => new RateLimiter(providers))
			.addService(
				'signUpManager',
				({ emailValidator, passwordStrengthValidator }) => new SignUpManager(emailValidator, passwordStrengthValidator),
			)
			.addService('passwordChangeManager', ({ providers, passwordStrengthValidator }) => new PasswordChangeManager(providers, passwordStrengthValidator))
			.addService('projectMemberManager', () => new ProjectMemberManager())
			.addService('identityFactory', ({ projectMemberManager }) => new IdentityFactory(projectMemberManager))
			.addService('projectScopeFactory', () => new ProjectScopeFactory(new AclSchemaAccessNodeFactory()))
			.addService(
				'permissionContextFactory',
				({ authorizator, identityFactory, projectScopeFactory, projectSchemaResolver }) =>
					new PermissionContextFactory(authorizator, identityFactory, projectScopeFactory, projectSchemaResolver),
			)
			.addService('secretManager', ({ providers }) => new SecretsManager(providers))
			.addService('projectManager', ({ secretManager, apiKeyService }) => new ProjectManager(secretManager, args.projectInitializer, apiKeyService))
			.addService('personAccessManager', ({ apiKeyManager }) => new PersonAccessManager(apiKeyManager))
			.addService('personManager', ({ emailValidator }) => new PersonManager(emailValidator))
			.addService(
				'passwordResetManager',
				({ userMailer, projectManager, passwordStrengthValidator }) => new PasswordResetManager(userMailer, projectManager, passwordStrengthValidator),
			)
			.addService(
				'emailVerificationManager',
				({ userMailer, projectManager }) => new EmailVerificationManager(userMailer, projectManager),
			)
			.addService(
				'emailChangeManager',
				({ userMailer, projectManager, emailValidator, apiKeyManager, permissionContextFactory }) =>
					new EmailChangeManager(userMailer, projectManager, emailValidator, apiKeyManager, permissionContextFactory),
			)
			.addService(
				'idpSignInManager',
				({ apiKeyManager, idpRegistry, idpClaimSyncService }) => new IDPSignInManager(apiKeyManager, idpRegistry, idpClaimSyncService),
			)
			.addService('idpManager', ({ idpRegistry, projectSchemaResolver }) => new IDPManager(idpRegistry, projectSchemaResolver))
			.addService('personIdentityProviderManager', () => new PersonIdentityProviderManager())
			.addService('otpAuthenticator', ({ providers }) => new OtpAuthenticator(providers))
			.addService('otpManager', ({ otpAuthenticator, providers }) => new OtpManager(otpAuthenticator, providers))
			.addService('backupCodeManager', ({ providers, userMailer }) => new BackupCodeManager(userMailer, providers))
			.addService('emailOtpManager', ({ userMailer, providers, rateLimiter }) => new EmailOtpManager(userMailer, providers, rateLimiter))
			.addService('authPolicyManager', ({ projectManager }) => new AuthPolicyManager(projectManager))
			.addService(
				'signInManager',
				({ apiKeyManager, providers, otpManager, backupCodeManager, emailOtpManager, authPolicyResolver, loginRiskAnalyzer, userMailer }) =>
					new SignInManager(
						apiKeyManager,
						providers,
						otpManager,
						backupCodeManager,
						emailOtpManager,
						authPolicyResolver,
						loginRiskAnalyzer,
						userMailer,
					),
			)
			.addService('membershipValidator', ({ projectSchemaResolver }) => new MembershipValidator(projectSchemaResolver))
			.addService('inviteManager', ({ providers, userMailer, projectSchemaResolver }) => new InviteManager(providers, userMailer, projectSchemaResolver))
			.addService('mailTemplateManager', () => new MailTemplateManager())
			.addService('rolesManager', () => new RolesManager())
			.addService('configurationManager', () => new ConfigurationManager())
			.addService(
				'passwordlessSignInManager',
				({ apiKeyManager, userMailer, projectManager, otpManager, backupCodeManager }) =>
					new PasswordlessSignInManager(apiKeyManager, userMailer, projectManager, otpManager, backupCodeManager),
			)
			.addService(
				'identityTypeResolver',
				({ projectMemberManager, projectManager, permissionContextFactory }) =>
					new IdentityTypeResolver(projectMemberManager, projectManager, permissionContextFactory),
			)
			.addService(
				'projectTypeResolver',
				({ projectMemberManager, projectSchemaResolver, secretManager }) =>
					new ProjectTypeResolver(projectMemberManager, projectSchemaResolver, secretManager),
			)
			.addService('personTypeResolver', ({ personIdentityProviderManager }) => new PersonTypeResolver(personIdentityProviderManager))
			.addService(
				'signInResponseFactory',
				({ permissionContextFactory, identityTypeResolver }) => new SignInResponseFactory(permissionContextFactory, identityTypeResolver),
			)
			.addService('meQueryResolver', () => new MeQueryResolver())
			.addService(
				'personQueryResolver',
				({ personManager, projectManager, projectMemberManager }) => new PersonQueryResolver(personManager, projectManager, projectMemberManager),
			)
			.addService('idpQueryResolver', ({ idpManager }) => new IDPQueryResolver(idpManager))
			.addService('projectQueryResolver', ({ projectManager }) => new ProjectQueryResolver(projectManager))
			.addService(
				'projectMembersQueryResolver',
				({ projectManager, projectMemberManager }) => new ProjectMembersQueryResolver(projectManager, projectMemberManager),
			)
			.addService('mailTemplateQueryResolver', () => new MailTemplateQueryResolver())
			.addService(
				'signUpMutationResolver',
				({ signUpManager, apiKeyManager, captchaValidator, rateLimiter, emailVerificationManager, permissionContextFactory }) =>
					new SignUpMutationResolver(signUpManager, apiKeyManager, captchaValidator, rateLimiter, emailVerificationManager, permissionContextFactory),
			)
			.addService(
				'signInMutationResolver',
				({ signInManager, signInResponseFactory, rateLimiter }) => new SignInMutationResolver(signInManager, signInResponseFactory, rateLimiter),
			)
			.addService('signOutMutationResolver', ({ signOutManager }) => new SignOutMutationResolver(signOutManager))
			.addService(
				'changeProfileMutationResolver',
				({ personManager, emailChangeManager, permissionContextFactory }) =>
					new ChangeProfileMutationResolver(personManager, emailChangeManager, permissionContextFactory),
			)
			.addService(
				'emailVerificationMutationResolver',
				({ emailVerificationManager, permissionContextFactory, captchaValidator, rateLimiter }) =>
					new EmailVerificationMutationResolver(emailVerificationManager, permissionContextFactory, captchaValidator, rateLimiter),
			)
			.addService('changePasswordMutationResolver', ({ passwordChangeManager }) => new ChangePasswordMutationResolver(passwordChangeManager))
			.addService(
				'resetPasswordMutationResolver',
				({ passwordResetManager, permissionContextFactory, captchaValidator, rateLimiter }) =>
					new ResetPasswordMutationResolver(passwordResetManager, permissionContextFactory, captchaValidator, rateLimiter),
			)
			.addService(
				'inviteMutationResolver',
				({ inviteManager, projectManager, membershipValidator }) => new InviteMutationResolver(inviteManager, projectManager, membershipValidator),
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
				({ projectMemberManager, projectManager }) => new RemoveProjectMemberMutationResolver(projectMemberManager, projectManager),
			)
			.addService(
				'createApiKeyMutationResolver',
				({ apiKeyManager, projectManager, membershipValidator }) => new CreateApiKeyMutationResolver(apiKeyManager, projectManager, membershipValidator),
			)
			.addService('disableApiKeyMutationResolver', ({ apiKeyManager }) => new DisableApiKeyMutationResolver(apiKeyManager))
			.addService(
				'otpMutationResolver',
				({ otpManager, backupCodeManager, authPolicyResolver }) => new OtpMutationResolver(otpManager, backupCodeManager, authPolicyResolver),
			)
			.addService(
				'emailOtpMutationResolver',
				({ emailOtpManager, backupCodeManager, authPolicyResolver }) =>
					new EmailOtpMutationResolver(emailOtpManager, backupCodeManager, authPolicyResolver),
			)
			.addService(
				'regenerateBackupCodesMutationResolver',
				({ backupCodeManager }) => new RegenerateBackupCodesMutationResolver(backupCodeManager),
			)
			.addService(
				'mailTemplateMutationResolver',
				({ projectManager, mailTemplateManager }) => new MailTemplateMutationResolver(projectManager, mailTemplateManager),
			)
			.addService(
				'idpMutationResolver',
				({ idpSignInManager, signInResponseFactory }) => new IDPMutationResolver(idpSignInManager, signInResponseFactory),
			)
			.addService('registerIdpMutationResolver', ({ idpManager }) => new AddIDPMutationResolver(idpManager))
			.addService('updateIdpMutationResolver', ({ idpManager }) => new UpdateIDPMutationResolver(idpManager))
			.addService('disableIdpMutationResolver', ({ idpManager }) => new DisableIDPMutationResolver(idpManager))
			.addService('enableIdpMutationResolver', ({ idpManager }) => new EnableIDPMutationResolver(idpManager))
			.addService(
				'disconnectMyIdentityProviderMutationResolver',
				({ personIdentityProviderManager }) => new DisconnectMyIdentityProviderMutationResolver(personIdentityProviderManager),
			)
			.addService('createProjectMutationResolver', ({ projectManager }) => new CreateProjectMutationResolver(projectManager))
			.addService(
				'disablePersonMutationResolver',
				({ personAccessManager, personManager }) => new DisablePersonMutationResolver(personAccessManager, personManager),
			)
			.addService(
				'forceSignOutMutationResolver',
				({ apiKeyManager, personManager, userMailer }) => new ForceSignOutMutationResolver(apiKeyManager, personManager, userMailer),
			)
			.addService(
				'resetPersonMfaMutationResolver',
				({ personManager, backupCodeManager }) => new ResetPersonMfaMutationResolver(personManager, backupCodeManager),
			)
			.addService(
				'revokeSessionMutationResolver',
				({ apiKeyManager }) => new RevokeSessionMutationResolver(apiKeyManager),
			)
			.addService('updateProjectMutationResolver', ({ projectManager }) => new UpdateProjectMutationResolver(projectManager))
			.addService(
				'setProjectSecretMutationResolver',
				({ projectManager, secretManager }) => new SetProjectSecretMutationResolver(projectManager, secretManager),
			)
			.addService('identityGlobalRolesMutationResolver', ({ rolesManager }) => new IdentityGlobalRolesMutationResolver(rolesManager))
			.addService('configurationMutationResolver', ({ configurationManager }) => new ConfigurationMutationResolver(configurationManager))
			.addService('configurationQueryResolver', ({ configurationManager }) => new ConfigurationQueryResolver(configurationManager))
			.addService('authPolicyMutationResolver', ({ authPolicyManager }) => new AuthPolicyMutationResolver(authPolicyManager))
			.addService('authPolicyQueryResolver', ({ authPolicyManager }) => new AuthPolicyQueryResolver(authPolicyManager))
			.addService('authLogQueryResolver', () => new AuthLogQueryResolver())
			.addService('apiKeyQueryResolver', () => new ApiKeyQueryResolver())
			.addService(
				'passwordlessMutationResolver',
				({ passwordlessSignInManager, signInResponseFactory, captchaValidator, rateLimiter }) =>
					new PasswordlessMutationResolver(passwordlessSignInManager, signInResponseFactory, captchaValidator, rateLimiter),
			)
			.addService(
				'togglePasswordlessMutationResolver',
				({ configurationManager, personManager }) => new TogglePasswordlessMutationResolver(configurationManager, personManager),
			)
			.addService(
				'resolverContextFactory',
				({ permissionContextFactory, authLogService, loginRiskAnalyzer }) =>
					new TenantResolverContextFactory(permissionContextFactory, authLogService, loginRiskAnalyzer),
			)
			.addService('resolvers', container => new ResolverFactory(container).create())
			.addService('connection', () => args.connection)
			.addService('readConnection', () => args.readConnection)
			.addService(
				'databaseContext',
				({ connection, providers }) => new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers),
			)
			.addService(
				'readDatabaseContext',
				({ readConnection, providers }) => new DatabaseContext(readConnection.createClient('tenant', { module: 'tenant' }), providers),
			)
			.addService('identityFetcher', ({ databaseContext }) => new IdentityFetcher(databaseContext.client))
			.addService('migrationsRunner', ({ providers }) => new TenantMigrationsRunner(args.dbCredentials, 'tenant', args.tenantCredentials, providers))
	}
}

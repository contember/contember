import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar Json
	scalar DateTime

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		me: Identity!
		personById(id: String!): Person
		projects: [Project!]!
		projectBySlug(slug: String!): Project
		projectMemberships(projectSlug: String!, identityId: String!): [Membership!]!
		checkResetPasswordToken(requestId: String!, token: String!): CheckResetPasswordTokenCode!

		identityProviders: [IdentityProvider!]!
		mailTemplates: [MailTemplateData!]!
		
		configuration: Config!
	}

	type Mutation {
		signUp(email: String!, password: String, passwordHash: String, roles: [String!], name: String): SignUpResponse
		signIn(email: String!, password: String!, expiration: Int, otpToken: String): SignInResponse
		createSessionToken(email: String, personId: String, expiration: Int): CreateSessionTokenResponse
		signOut(all: Boolean): SignOutResponse
		changeProfile(personId: String!, email: String, name: String): ChangeProfileResponse
		changeMyProfile(email: String, name: String): ChangeMyProfileResponse
		changePassword(personId: String!, password: String!): ChangePasswordResponse
		changeMyPassword(currentPassword: String!, newPassword: String!): ChangeMyPasswordResponse

		initSignInIDP(
			identityProvider: String!,
			data: Json
			redirectUrl: String @deprecated(reason: "use data.redirectUrl")
		): InitSignInIDPResponse
		signInIDP(
			identityProvider: String!,
			data: Json,
			expiration: Int
			idpResponse: IDPResponseInput, @deprecated(reason: "pass idpResponse.url as data.url")
			redirectUrl: String @deprecated(reason: "use data.redirectUrl"),
			sessionData: Json @deprecated(reason: "use data.sessionData"),
		): SignInIDPResponse
		
		# passwordless sign in
		initSignInPasswordless(email: String!, options: InitSignInPasswordlessOptions): InitSignInPasswordlessResponse
		signInPasswordless(requestId: String!, validationType: PasswordlessValidationType!, token: String!, expiration: Int, mfaOtp: String): SignInPasswordlessResponse
		activatePasswordlessOtp(requestId: String!, token: String!, otpHash: String!): ActivatePasswordlessOtpResponse

        enableMyPasswordless: ToggleMyPasswordlessResponse
        disableMyPasswordless: ToggleMyPasswordlessResponse

		# IDP management
		addIDP(identityProvider: String!, type: String!, configuration: Json!, options: IDPOptions): AddIDPResponse
		updateIDP(identityProvider: String!, type: String, configuration: Json, options: IDPOptions, mergeConfiguration: Boolean): UpdateIDPResponse
		disableIDP(identityProvider: String!): DisableIDPResponse
		enableIDP(identityProvider: String!): EnableIDPResponse

		prepareOtp(label: String): PrepareOtpResponse
		confirmOtp(otpToken: String!): ConfirmOtpResponse
		disableOtp: DisableOtpResponse

		disablePerson(personId: String!): DisablePersonResponse

		createResetPasswordRequest(email: String!, options: CreateResetPasswordRequestOptions): CreatePasswordResetRequestResponse
		resetPassword(token: String!, password: String!): ResetPasswordResponse

		invite(email: String!, name: String, projectSlug: String!, memberships: [MembershipInput!]!, options: InviteOptions): InviteResponse
		unmanagedInvite(
			email: String!,
			name: String,
			projectSlug: String!,
			memberships: [MembershipInput!]!,
			options: UnmanagedInviteOptions,
			password: String @deprecated(reason: "Use options")
		): InviteResponse

		addProjectMember(projectSlug: String!, identityId: String!, memberships: [MembershipInput!]!): AddProjectMemberResponse
		removeProjectMember(projectSlug: String!, identityId: String!): RemoveProjectMemberResponse

		updateProjectMember(projectSlug: String!, identityId: String!, memberships: [MembershipInput!]!): UpdateProjectMemberResponse

		createApiKey(projectSlug: String!, memberships: [MembershipInput!]!, description: String!, tokenHash: String): CreateApiKeyResponse
		createGlobalApiKey(description: String!, roles: [String!], tokenHash: String): CreateApiKeyResponse
		disableApiKey(id: String!): DisableApiKeyResponse
		addGlobalIdentityRoles(identityId: String!, roles: [String!]!): AddGlobalIdentityRolesResponse
		removeGlobalIdentityRoles(identityId: String!, roles: [String!]!): RemoveGlobalIdentityRolesResponse

		addMailTemplate(template: MailTemplate!): AddMailTemplateResponse
		removeMailTemplate(templateIdentifier: MailTemplateIdentifier!): RemoveMailTemplateResponse

		createProject(
			projectSlug: String!,
			name: String,
			config: Json,
			secrets: [ProjectSecret!],
			options: CreateProjectOptions,
			deployTokenHash: String @deprecated(reason: "Use options")
		): CreateProjectResponse
		setProjectSecret(projectSlug: String!, key: String!, value: String!): SetProjectSecretResponse
		updateProject(projectSlug: String!, name: String, config: Json, mergeConfig: Boolean): UpdateProjectResponse
		
		configure(config: ConfigInput!): ConfigureResponse

		addProjectMailTemplate(template: MailTemplate!): AddMailTemplateResponse
		@deprecated(reason: "use addMailTemplate")

		removeProjectMailTemplate(templateIdentifier: MailTemplateIdentifier!): RemoveMailTemplateResponse
		@deprecated(reason: "use removeMailTemplate")

	}
	
	# === configure ===
	
	type Config {
		passwordless: ConfigPasswordless!
		password: ConfigPassword!
		login: ConfigLogin!
	}
	
	type ConfigPasswordless {
		enabled: ConfigPolicy!
		url: String
		expirationMinutes: Int!
	}
	
	type ConfigPassword {
		minLength: Int!
		requireUppercase: Int!
		requireLowercase: Int!
		requireDigit: Int!
		requireSpecial: Int!
		pattern: String
		checkBlacklist: Boolean!
    }
	
	type ConfigLogin {
		baseBackoffMs: Int!
		maxBackoffMs: Int!
		attemptWindowMs: Int!
		revealUserExists: Boolean!
		defaultTokenExpirationMinutes: Int!
		maxTokenExpirationMinutes: Int
    }
	
	input ConfigInput {
		passwordless: ConfigPasswordlessInput
		password: ConfigPasswordInput
		login: ConfigLoginInput
	}
	
	enum ConfigPolicy {
		always
		never
		optIn
		optOut
	}
	
	input ConfigPasswordlessInput {
		enabled: ConfigPolicy
		url: String
		expirationMinutes: Int
	}
	
	input ConfigPasswordInput {
		minLength: Int
		requireUppercase: Int
		requireLowercase: Int
		requireDigit: Int
		requireSpecial: Int
		pattern: String
		checkBlacklist: Boolean
    }
	
	input ConfigLoginInput {
		baseBackoffMs: Int
		maxBackoffMs: Int
		attemptWindowMs: Int
		revealUserExists: Boolean
		defaultTokenExpirationMinutes: Int
		maxTokenExpirationMinutes: Int
    }
	
	type ConfigureResponse {
		ok: Boolean!
		error: ConfigureError
	}
	
	type ConfigureError {
		code: ConfigureErrorCode!
		developerMessage: String!
	}
	
	enum ConfigureErrorCode {
		INVALID_CONFIG
	}

	# === signUp ===
	type SignUpResponse {
		ok: Boolean!
		errors: [SignUpError!]! @deprecated
		error: SignUpError
		result: SignUpResult
	}

	type SignUpError {
		code: SignUpErrorCode!
		developerMessage: String!
		endPersonMessage: String @deprecated
	}

	enum SignUpErrorCode {
		EMAIL_ALREADY_EXISTS
		INVALID_EMAIL_FORMAT
		TOO_WEAK
	}

	type SignUpResult {
		person: Person!
	}

	# === signInCommon ==

	interface CommonSignInResult {
		token: String!
		person: Person!
	}

	# === signIn ===
	type SignInResponse {
		ok: Boolean!
		errors: [SignInError!]! @deprecated
		error: SignInError
		result: SignInResult
	}

	type SignInError {
		code: SignInErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignInErrorCode {
		UNKNOWN_EMAIL
		INVALID_PASSWORD
		PERSON_DISABLED
		NO_PASSWORD_SET
		OTP_REQUIRED
		INVALID_OTP_TOKEN
	}

	type SignInResult implements CommonSignInResult {
		token: String!
		person: Person!
	}

	# == createSessionToken ==

	type CreateSessionTokenResponse {
		ok: Boolean!
		error: CreateSessionTokenError
		result: CreateSessionTokenResult
	}

	type CreateSessionTokenError {
		code: CreateSessionTokenErrorCode!
		developerMessage: String!
	}

	enum CreateSessionTokenErrorCode {
		UNKNOWN_EMAIL
		UNKNOWN_PERSON_ID
		PERSON_DISABLED
	}

	type CreateSessionTokenResult implements CommonSignInResult{
		token: String!
		person: Person!
	}

	# === signOut ===

	type SignOutResponse {
		ok: Boolean!
		errors: [SignOutError!]! @deprecated
		error: SignOutError
	}

	type SignOutError {
		code: SignOutErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignOutErrorCode {
		NOT_A_PERSON,
		NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY
	}

	# === changeProfile ===
	
	type ChangeProfileResponse {
		ok: Boolean!
		error: ChangeProfileError
	}
	
	type ChangeProfileError {
		code: ChangeProfileErrorCode!
		developerMessage: String!
	}
	
	enum ChangeProfileErrorCode {
		PERSON_NOT_FOUND
		INVALID_EMAIL_FORMAT
		EMAIL_ALREADY_EXISTS
	}
	
	# === changeMyProfile ===

	type ChangeMyProfileResponse {
		ok: Boolean!
		error: ChangeMyProfileError
	}

	type ChangeMyProfileError {
		code: ChangeMyProfileErrorCode!
		developerMessage: String!
	}

	enum ChangeMyProfileErrorCode {
		NOT_A_PERSON
		INVALID_EMAIL_FORMAT
		EMAIL_ALREADY_EXISTS
	}	

	# === changePassword ===

	type ChangePasswordResponse {
		ok: Boolean!
		errors: [ChangePasswordError!]! @deprecated
		error: ChangePasswordError
	}

	type ChangePasswordError {
		code: ChangePasswordErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ChangePasswordErrorCode {
		PERSON_NOT_FOUND
		TOO_WEAK
	}


	# === changeMyPassword ===
	
	type ChangeMyPasswordResponse {
		ok: Boolean!
		error: ChangeMyPasswordError
	}

	type ChangeMyPasswordError {
		code: ChangeMyPasswordErrorCode!
		developerMessage: String!
	}

	enum ChangeMyPasswordErrorCode {
		TOO_WEAK
		NOT_A_PERSON
		INVALID_PASSWORD
		NO_PASSWORD_SET
	}

	# === IDP ===

	type InitSignInIDPResponse {
		ok: Boolean!
		errors: [InitSignInIDPError!]! @deprecated
		error: InitSignInIDPError
		result: InitSignInIDPResult
	}

	type InitSignInIDPResult {
		authUrl: String!
		sessionData: Json!
		idpConfiguration: Json
	}

	type InitSignInIDPError {
		code: InitSignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum InitSignInIDPErrorCode {
		PROVIDER_NOT_FOUND
		IDP_VALIDATION_FAILED
	}

	input IDPResponseInput {
		url: String!
	}

	type SignInIDPResponse {
		ok: Boolean!
		errors: [SignInIDPError!]! @deprecated
		error: SignInIDPError
		result: SignInIDPResult
	}

	type SignInIDPError {
		code: SignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignInIDPErrorCode {
		INVALID_IDP_RESPONSE
		IDP_VALIDATION_FAILED

		PERSON_NOT_FOUND
		PERSON_DISABLED
		PERSON_ALREADY_EXISTS
	}

	type SignInIDPResult implements CommonSignInResult {
		token: String!
		person: Person!
		idpResponse: Json
	}

	type AddIDPResponse {
		error: AddIDPError
		ok: Boolean!
	}

	type AddIDPError {
		code: AddIDPErrorCode!
		developerMessage: String!
	}

	enum AddIDPErrorCode {
		ALREADY_EXISTS
		UNKNOWN_TYPE
		INVALID_CONFIGURATION
	}

	type UpdateIDPResponse {
		error: UpdateIDPError
		ok: Boolean!
	}

	type UpdateIDPError {
		code: UpdateIDPErrorCode!
		developerMessage: String!
	}

	enum UpdateIDPErrorCode {
		NOT_FOUND
		INVALID_CONFIGURATION
	}


	type DisableIDPResponse {
		error: DisableIDPError
		ok: Boolean!
	}

	type DisableIDPError {
		code: DisableIDPErrorCode!
		developerMessage: String!
	}

	enum DisableIDPErrorCode {
		NOT_FOUND
	}

	type EnableIDPResponse {
		error: EnableIDPError
		ok: Boolean!
	}

	type EnableIDPError {
		code: EnableIDPErrorCode!
		developerMessage: String!
	}

	enum EnableIDPErrorCode {
		NOT_FOUND
	}

	type IdentityProvider {
		slug: String!
		type: String!
		configuration: Json!
		disabledAt: DateTime
		options: IDPOptionsOutput!
	}

	type IDPOptionsOutput {
		autoSignUp: Boolean!
		exclusive: Boolean!
		initReturnsConfig: Boolean!
	}

	input IDPOptions {
		autoSignUp: Boolean
		exclusive: Boolean
		initReturnsConfig: Boolean
	}

	# === passwordless sign in ===
	
	type InitSignInPasswordlessResponse {
		ok: Boolean!
		error: InitSignInPasswordlessError
		result: InitSignInPasswordlessResult
	}
	
	type InitSignInPasswordlessError {
		code: InitSignInPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum InitSignInPasswordlessErrorCode {
		PERSON_NOT_FOUND
		
		PASSWORDLESS_DISABLED
	}
	
	type InitSignInPasswordlessResult {
		requestId: String!
		expiresAt: DateTime!
	}

	input InitSignInPasswordlessOptions {
		mailVariant: String
		mailProject: String
	}
	
	type SignInPasswordlessResponse {
		ok: Boolean!
		error: SignInPasswordlessError
		result: SignInPasswordlessResult
	}
	
	enum PasswordlessValidationType {
		otp
		token
	}
	
	type SignInPasswordlessError {
		code: SignInPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum SignInPasswordlessErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_EXPIRED
		TOKEN_USED
		PERSON_DISABLED
		OTP_REQUIRED
		INVALID_OTP_TOKEN
	}
	
	type SignInPasswordlessResult implements CommonSignInResult {
		token: String!
		person: Person!
	}
	
	type ActivatePasswordlessOtpResponse {
		ok: Boolean!
		error: ActivatePasswordlessOtpError
	}
	
	type ActivatePasswordlessOtpError {
		code: ActivatePasswordlessOtpErrorCode!
		developerMessage: String!
	}
	
	enum ActivatePasswordlessOtpErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_EXPIRED
		TOKEN_USED
	}
	
	type ToggleMyPasswordlessResponse {
		ok: Boolean!
		error: ToggleMyPasswordlessError
	}
	
	type ToggleMyPasswordlessError {
		code: ToggleMyPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum ToggleMyPasswordlessErrorCode {
		CANNOT_TOGGLE
        NOT_A_PERSON
	}
	

	# === invite ===

	type InviteResponse {
		ok: Boolean!
		errors: [InviteError!]! @deprecated
		error: InviteError
		result: InviteResult
	}

	type InviteError {
		code: InviteErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum InviteErrorCode {
		PROJECT_NOT_FOUND
		ALREADY_MEMBER
		INVALID_MEMBERSHIP
		INVALID_EMAIL_FORMAT

		ROLE_NOT_FOUND @deprecated
		VARIABLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
	}

	type InviteResult {
		person: Person!
		isNew: Boolean!
	}

	enum InviteMethod {
		CREATE_PASSWORD
		RESET_PASSWORD
	}

	input InviteOptions {
		method: InviteMethod
		mailVariant: String
	}

	input UnmanagedInviteOptions {
		password: String
		resetTokenHash: String
	}

	# === addProjectMember ===

	type AddProjectMemberResponse {
		ok: Boolean!
		errors: [AddProjectMemberError!]!
		error: AddProjectMemberError
	}

	type AddProjectMemberError {
		code: AddProjectMemberErrorCode!
		membershipValidation: [MembershipValidationError!]
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum AddProjectMemberErrorCode {
		PROJECT_NOT_FOUND
		IDENTITY_NOT_FOUND
		ALREADY_MEMBER
		INVALID_MEMBERSHIP

		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
		VARIABLE_NOT_FOUND @deprecated
	}

	# === updateProjectMember ===

	type UpdateProjectMemberResponse {
		ok: Boolean!
		errors: [UpdateProjectMemberError!]! @deprecated
		error: UpdateProjectMemberError
	}

	type UpdateProjectMemberError {
		code: UpdateProjectMemberErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum UpdateProjectMemberErrorCode {
		PROJECT_NOT_FOUND
		NOT_MEMBER
		INVALID_MEMBERSHIP

		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
		VARIABLE_NOT_FOUND @deprecated
	}

	# === removeProjectMember ===

	type RemoveProjectMemberResponse {
		ok: Boolean!
		errors: [RemoveProjectMemberError!]!
		error: RemoveProjectMemberError
	}

	type RemoveProjectMemberError {
		code: RemoveProjectMemberErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum RemoveProjectMemberErrorCode {
		NOT_MEMBER
		PROJECT_NOT_FOUND
	}

	# === createApiKey ===

	type CreateApiKeyResponse {
		ok: Boolean!
		errors: [CreateApiKeyError!]! @deprecated
		error: CreateApiKeyError
		result: CreateApiKeyResult
	}

	type CreateApiKeyError {
		code: CreateApiKeyErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum CreateApiKeyErrorCode {
		PROJECT_NOT_FOUND
		INVALID_MEMBERSHIP

		VARIABLE_NOT_FOUND @deprecated
		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
	}

	type CreateApiKeyResult {
		apiKey: ApiKeyWithToken!
	}

	# === disableApiKey ===

	type DisableApiKeyResponse {
		ok: Boolean!
		errors: [DisableApiKeyError!]! @deprecated
		error: DisableApiKeyError
	}

	type DisableApiKeyError {
		code: DisableApiKeyErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum DisableApiKeyErrorCode {
		KEY_NOT_FOUND
	}
	# === addGlobalIdentityRoles ===

	type AddGlobalIdentityRolesResponse {
		ok: Boolean!
		error: AddGlobalIdentityRolesError
		result: AddGlobalIdentityRolesResult
	}

	type AddGlobalIdentityRolesResult {
		identity: Identity!
	}
	type AddGlobalIdentityRolesError {
		code: AddGlobalIdentityRolesErrorCode!
		developerMessage: String!
	}

	enum AddGlobalIdentityRolesErrorCode {
		IDENTITY_NOT_FOUND
		INVALID_ROLE
	}


	# === removeGlobalIdentityRoles ===

	type RemoveGlobalIdentityRolesResponse {
		ok: Boolean!
		error: RemoveGlobalIdentityRolesError
		result: RemoveGlobalIdentityRolesResult
	}

	type RemoveGlobalIdentityRolesError {
		code: RemoveGlobalIdentityRolesErrorCode!
		developerMessage: String!
	}

	type RemoveGlobalIdentityRolesResult {
		identity: Identity!
	}

	enum RemoveGlobalIdentityRolesErrorCode {
		IDENTITY_NOT_FOUND
		INVALID_ROLE
	}
	# === common ===

	# === variables ===

	input VariableEntryInput {
		name: String!
		values: [String!]!
	}

	type VariableEntry {
		name: String!
		values: [String!]!
	}

	# === membership ===

	input MembershipInput {
		role: String!
		variables: [VariableEntryInput!]!
	}

	type Membership {
		role: String!
		variables: [VariableEntry!]!
	}

	type MembershipValidationError {
		code: MembershipValidationErrorCode!
		role: String!
		variable: String
	}

	enum MembershipValidationErrorCode {
		ROLE_NOT_FOUND
		VARIABLE_NOT_FOUND
		VARIABLE_EMPTY
		VARIABLE_INVALID
	}

	# === person ====

	type Person {
		id: String!
		email: String
		name: String
		otpEnabled: Boolean!
		passwordlessEnabled: Boolean
		identity: Identity!
	}

	# === api key ===

	type ApiKey {
		id: String!
		identity: Identity!
	}

	type ApiKeyWithToken {
		id: String!
		token: String
		identity: Identity!
	}

	# === identity ===

	type Identity {
		id: String!
		description: String
		person: Person
		apiKey: ApiKey
		projects: [IdentityProjectRelation!]!
		permissions: IdentityGlobalPermissions
		roles: [String!]
	}

	type IdentityGlobalPermissions {
		canCreateProject: Boolean!
		canDeployEntrypoint: Boolean!
	}

	type IdentityProjectRelation {
		project: Project!
		memberships: [Membership!]!
	}

	# === project ===

	type Project {
		id: String!
		name: String!
		slug: String!
		config: Json!
		roles: [RoleDefinition!]!
		members(
			input: ProjectMembersInput,
			memberType: MemberType @deprecated(reason: "Use args")
		): [ProjectIdentityRelation!]!
	}

	input ProjectMembersInput {
		limit: Int
		offset: Int
		filter: ProjectMembersFilter
	}

	input ProjectMembersFilter {
		memberType: MemberType
		email: [String!]
		identityId: [String!]
		personId: [String!]
	}

	enum MemberType {
		API_KEY
		PERSON
	}

	type ProjectIdentityRelation {
		identity: Identity!
		memberships: [Membership!]!
	}

	type RoleDefinition {
		name: String!
		variables: [RoleVariableDefinition!]!
	}

	interface RoleVariableDefinition {
		name: String!
	}

	type RoleEntityVariableDefinition implements RoleVariableDefinition {
		name: String!
		entityName: String!
	}

	type RolePredefinedVariableDefinition implements RoleVariableDefinition {
		name: String!
		value: String!
	}

	type RoleConditionVariableDefinition implements RoleVariableDefinition {
		name: String!
	}

	# ==== 2fa ====

	type PrepareOtpResponse {
		ok: Boolean!
		result: PrepareOtpResult
	}

	type PrepareOtpResult {
		otpUri: String!
		otpSecret: String!
	}

	type ConfirmOtpResponse {
		ok: Boolean!
		errors: [ConfirmOtpError!]! @deprecated
		error: ConfirmOtpError
	}

	type ConfirmOtpError {
		code: ConfirmOtpErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ConfirmOtpErrorCode {
		INVALID_OTP_TOKEN
		NOT_PREPARED
	}

	type DisableOtpResponse {
		ok: Boolean!
		errors: [DisableOtpError!]! @deprecated
		error: DisableOtpError
	}

	type DisableOtpError {
		code: DisableOtpErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum DisableOtpErrorCode {
		OTP_NOT_ACTIVE
	}

	type DisablePersonResponse {
		ok: Boolean!
		error: DisablePersonError
	}

	type DisablePersonError {
		code: DisablePersonErrorCode!
		developerMessage: String!
	}

	enum DisablePersonErrorCode {
		PERSON_ALREADY_DISABLED
		PERSON_NOT_FOUND
	}

	# === mails ===
	
	type MailTemplateData {
		projectSlug: String
		type: MailType!
		variant: String
		subject: String!
		content: String!
		useLayout: Boolean!
		replyTo: String
	}
	
	input MailTemplate {
		projectSlug: String
		type: MailType!
		"Custom mail variant identifier, e.g. a locale."
		variant: String
		subject: String!
		content: String!
		useLayout: Boolean
		replyTo: String
	}

	enum MailType {
		EXISTING_USER_INVITED
		NEW_USER_INVITED
		RESET_PASSWORD_REQUEST
		PASSWORDLESS_SIGN_IN
	}

	input MailTemplateIdentifier {
		projectSlug: String
		type: MailType!
		variant: String
	}

	type AddMailTemplateResponse {
		ok: Boolean!
		errors: [AddMailTemplateError!]! @deprecated
		error: AddMailTemplateError
	}

	type AddMailTemplateError {
		code: AddMailTemplateErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum AddMailTemplateErrorCode {
		MISSING_VARIABLE
		PROJECT_NOT_FOUND
		INVALID_REPLY_EMAIL_FORMAT
	}

	type RemoveMailTemplateResponse {
		ok: Boolean!
		errors: [RemoveMailTemplateError!]!
		error: RemoveMailTemplateError
	}

	type RemoveMailTemplateError {
		code: RemoveMailTemplateErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum RemoveMailTemplateErrorCode {
		PROJECT_NOT_FOUND
		TEMPLATE_NOT_FOUND
	}

	# === password reset ===

	type CheckResetPasswordTokenResult {
		code: CheckResetPasswordTokenCode!
	}

	enum CheckResetPasswordTokenCode {
		REQUEST_NOT_FOUND
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED
	}

	type CreatePasswordResetRequestResponse {
		ok: Boolean!
		errors: [CreatePasswordResetRequestError!]! @deprecated
		error: CreatePasswordResetRequestError
	}

	type CreatePasswordResetRequestError {
		code: CreatePasswordResetRequestErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum CreatePasswordResetRequestErrorCode {
		PERSON_NOT_FOUND
	}

	type ResetPasswordResponse {
		ok: Boolean!
		errors: [ResetPasswordError!]! @deprecated
		error: ResetPasswordError
	}
	type ResetPasswordError {
		code: ResetPasswordErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ResetPasswordErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED

		PASSWORD_TOO_WEAK
	}

	input CreateResetPasswordRequestOptions {
		mailProject: String
		mailVariant: String
	}

	# === project ===

	input ProjectSecret {
		key: String!
		value: String!
	}

	input CreateProjectOptions {
		deployTokenHash: String
		noDeployToken: Boolean
	}

	type CreateProjectResponse {
		ok: Boolean!
		error: CreateProjectResponseError
		result: CreateProjectResult
	}

	type CreateProjectResponseError {
		code: CreateProjectResponseErrorCode!
		developerMessage: String!
	}

	type CreateProjectResult {
		deployerApiKey: ApiKeyWithToken
	}

	enum CreateProjectResponseErrorCode {
		ALREADY_EXISTS
		INIT_ERROR
	}

	type SetProjectSecretResponse {
		ok: Boolean!
		error: SetProjectSecretError
	}

	type SetProjectSecretError {
		code: SetProjectSecretErrorCode!
		developerMessage: String!
	}

	enum SetProjectSecretErrorCode {
		PROJECT_NOT_FOUND
	}

	type UpdateProjectResponse {
		ok: Boolean!
		error: UpdateProjectError
	}

	type UpdateProjectError {
		code: UpdateProjectErrorCode!
		developerMessage: String!
	}

	enum UpdateProjectErrorCode {
		PROJECT_NOT_FOUND
	}
`

export default schema

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
		projects: [Project!]!
		projectBySlug(slug: String!): Project
		projectMemberships(projectSlug: String!, identityId: String!): [Membership!]!
		checkResetPasswordToken(requestId: String!, token: String!): CheckResetPasswordTokenCode!

		identityProviders: [IdentityProvider!]!
	}

	type Mutation {
		signUp(email: String!, password: String, passwordHash: String, roles: [String!]): SignUpResponse
		signIn(email: String!, password: String!, expiration: Int, otpToken: String): SignInResponse
		createSessionToken(email: String!, expiration: Int): CreateSessionTokenResponse
		signOut(all: Boolean): SignOutResponse
		changePassword(personId: String!, password: String!): ChangePasswordResponse
		changeMyPassword(currentPassword: String!, newPassword: String!): ChangeMyPasswordResponse

		initSignInIDP(identityProvider: String!, redirectUrl: String!): InitSignInIDPResponse
		signInIDP(identityProvider: String!, idpResponse: IDPResponseInput!, redirectUrl: String!, sessionData: Json!, expiration: Int): SignInIDPResponse

		# IDP management
		addIDP(identityProvider: String!, type: String!, configuration: Json!, options: IDPOptions): AddIDPResponse
		updateIDP(identityProvider: String!, configuration: Json, options: IDPOptions): UpdateIDPResponse
		disableIDP(identityProvider: String!): DisableIDPResponse
		enableIDP(identityProvider: String!): EnableIDPResponse

		prepareOtp(label: String): PrepareOtpResponse
		confirmOtp(otpToken: String!): ConfirmOtpResponse
		disableOtp: DisableOtpResponse

		createResetPasswordRequest(email: String!, options: CreateResetPasswordRequestOptions): CreatePasswordResetRequestResponse
		resetPassword(token: String!, password: String!): ResetPasswordResponse

		invite(email: String!, projectSlug: String!, memberships: [MembershipInput!]!, options: InviteOptions): InviteResponse
		unmanagedInvite(
			email: String!,
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

		addProjectMailTemplate(template: MailTemplate!): AddMailTemplateResponse
			@deprecated(reason: "use addMailtemplate")

		removeProjectMailTemplate(templateIdentifier: MailTemplateIdentifier!): RemoveMailTemplateResponse
			@deprecated(reason: "use removeMailtemplate")

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
		NOT_A_PERSON
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
	}

	type InitSignInIDPError {
		code: InitSignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum InitSignInIDPErrorCode {
		PROVIDER_NOT_FOUND
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
	}

	type SignInIDPResult implements CommonSignInResult {
		token: String!
		person: Person!
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
		disabledAt: DateTime!
	}

	input IDPOptions {
		autoSignUp: Boolean
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
	}

	# === person ====

	type Person {
		id: String!
		email: String!
		otpEnabled: Boolean!
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
		members(memberType: MemberType): [ProjectIdentityRelation!]!
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

	# === mails ===

	input MailTemplate {
		projectSlug: String
		type: MailType!
		"Custom mail variant identifier, e.g. a locale."
		variant: String
		subject: String!
		content: String!
		useLayout: Boolean
	}

	enum MailType {
		EXISTING_USER_INVITED
		NEW_USER_INVITED
		RESET_PASSWORD_REQUEST
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
		#error: SetProjectSecretResponseError
	}

	#	type SetProjectSecretResponseError {
	#		code: SetProjectSecretResponseErrorCode!
	#		developerMessage: String!
	#	}
	#
	#	enum SetProjectSecretResponseErrorCode {
	#	}

	type UpdateProjectResponse {
		ok: Boolean!
		#error: UpdateProjectConfigResponseError
	}
`

export default schema

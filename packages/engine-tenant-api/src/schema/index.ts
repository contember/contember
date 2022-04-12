import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	DateTime: any
	Json: any
}

export type AddIdpError = {
	readonly __typename?: 'AddIDPError'
	readonly code: AddIdpErrorCode
	readonly developerMessage: Scalars['String']
}

export enum AddIdpErrorCode {
	AlreadyExists = 'ALREADY_EXISTS',
	UnknownType = 'UNKNOWN_TYPE',
	InvalidConfiguration = 'INVALID_CONFIGURATION'
}

export type AddIdpResponse = {
	readonly __typename?: 'AddIDPResponse'
	readonly error?: Maybe<AddIdpError>
	readonly ok: Scalars['Boolean']
}

export type AddMailTemplateError = {
	readonly __typename?: 'AddMailTemplateError'
	readonly code: AddMailTemplateErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum AddMailTemplateErrorCode {
	MissingVariable = 'MISSING_VARIABLE',
	ProjectNotFound = 'PROJECT_NOT_FOUND'
}

export type AddMailTemplateResponse = {
	readonly __typename?: 'AddMailTemplateResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<AddMailTemplateError>
	readonly error?: Maybe<AddMailTemplateError>
}

export type AddProjectMemberError = {
	readonly __typename?: 'AddProjectMemberError'
	readonly code: AddProjectMemberErrorCode
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum AddProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	IdentityNotFound = 'IDENTITY_NOT_FOUND',
	AlreadyMember = 'ALREADY_MEMBER',
	InvalidMembership = 'INVALID_MEMBERSHIP',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	VariableNotFound = 'VARIABLE_NOT_FOUND'
}

export type AddProjectMemberResponse = {
	readonly __typename?: 'AddProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<AddProjectMemberError>
	readonly error?: Maybe<AddProjectMemberError>
}

export type ApiKey = {
	readonly __typename?: 'ApiKey'
	readonly id: Scalars['String']
	readonly identity: Identity
}

export type ApiKeyWithToken = {
	readonly __typename?: 'ApiKeyWithToken'
	readonly id: Scalars['String']
	readonly token?: Maybe<Scalars['String']>
	readonly identity: Identity
}

export type ChangeMyPasswordError = {
	readonly __typename?: 'ChangeMyPasswordError'
	readonly code: ChangeMyPasswordErrorCode
	readonly developerMessage: Scalars['String']
}

export enum ChangeMyPasswordErrorCode {
	TooWeak = 'TOO_WEAK',
	NotAPerson = 'NOT_A_PERSON',
	InvalidPassword = 'INVALID_PASSWORD',
	NoPasswordSet = 'NO_PASSWORD_SET'
}

export type ChangeMyPasswordResponse = {
	readonly __typename?: 'ChangeMyPasswordResponse'
	readonly ok: Scalars['Boolean']
	readonly error?: Maybe<ChangeMyPasswordError>
}

export type ChangePasswordError = {
	readonly __typename?: 'ChangePasswordError'
	readonly code: ChangePasswordErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum ChangePasswordErrorCode {
	PersonNotFound = 'PERSON_NOT_FOUND',
	TooWeak = 'TOO_WEAK'
}

export type ChangePasswordResponse = {
	readonly __typename?: 'ChangePasswordResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ChangePasswordError>
	readonly error?: Maybe<ChangePasswordError>
}

export enum CheckResetPasswordTokenCode {
	RequestNotFound = 'REQUEST_NOT_FOUND',
	TokenNotFound = 'TOKEN_NOT_FOUND',
	TokenUsed = 'TOKEN_USED',
	TokenExpired = 'TOKEN_EXPIRED'
}

export type CheckResetPasswordTokenResult = {
	readonly __typename?: 'CheckResetPasswordTokenResult'
	readonly code: CheckResetPasswordTokenCode
}

export type CommonSignInResult = {
	readonly token: Scalars['String']
	readonly person: Person
}

export type ConfirmOtpError = {
	readonly __typename?: 'ConfirmOtpError'
	readonly code: ConfirmOtpErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum ConfirmOtpErrorCode {
	InvalidOtpToken = 'INVALID_OTP_TOKEN',
	NotPrepared = 'NOT_PREPARED'
}

export type ConfirmOtpResponse = {
	readonly __typename?: 'ConfirmOtpResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ConfirmOtpError>
	readonly error?: Maybe<ConfirmOtpError>
}

export type CreateApiKeyError = {
	readonly __typename?: 'CreateApiKeyError'
	readonly code: CreateApiKeyErrorCode
	readonly developerMessage: Scalars['String']
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum CreateApiKeyErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	InvalidMembership = 'INVALID_MEMBERSHIP',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY'
}

export type CreateApiKeyResponse = {
	readonly __typename?: 'CreateApiKeyResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly error?: Maybe<CreateApiKeyError>
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	readonly __typename?: 'CreateApiKeyResult'
	readonly apiKey: ApiKeyWithToken
}

export type CreatePasswordResetRequestError = {
	readonly __typename?: 'CreatePasswordResetRequestError'
	readonly code: CreatePasswordResetRequestErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum CreatePasswordResetRequestErrorCode {
	PersonNotFound = 'PERSON_NOT_FOUND'
}

export type CreatePasswordResetRequestResponse = {
	readonly __typename?: 'CreatePasswordResetRequestResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreatePasswordResetRequestError>
	readonly error?: Maybe<CreatePasswordResetRequestError>
}

export type CreateProjectResponse = {
	readonly __typename?: 'CreateProjectResponse'
	readonly ok: Scalars['Boolean']
	readonly error?: Maybe<CreateProjectResponseError>
	readonly result?: Maybe<CreateProjectResult>
}

export type CreateProjectResponseError = {
	readonly __typename?: 'CreateProjectResponseError'
	readonly code: CreateProjectResponseErrorCode
	readonly developerMessage: Scalars['String']
}

export enum CreateProjectResponseErrorCode {
	AlreadyExists = 'ALREADY_EXISTS',
	InitError = 'INIT_ERROR'
}

export type CreateProjectResult = {
	readonly __typename?: 'CreateProjectResult'
	readonly deployerApiKey: ApiKeyWithToken
}

export type CreateResetPasswordRequestOptions = {
	readonly mailProject?: Maybe<Scalars['String']>
	readonly mailVariant?: Maybe<Scalars['String']>
}

export type CreateSessionTokenError = {
	readonly __typename?: 'CreateSessionTokenError'
	readonly code: CreateSessionTokenErrorCode
	readonly developerMessage: Scalars['String']
}

export enum CreateSessionTokenErrorCode {
	UnknownEmail = 'UNKNOWN_EMAIL'
}

export type CreateSessionTokenResponse = {
	readonly __typename?: 'CreateSessionTokenResponse'
	readonly ok: Scalars['Boolean']
	readonly error?: Maybe<CreateSessionTokenError>
	readonly result?: Maybe<CreateSessionTokenResult>
}

export type CreateSessionTokenResult = CommonSignInResult & {
	readonly __typename?: 'CreateSessionTokenResult'
	readonly token: Scalars['String']
	readonly person: Person
}


export type DisableApiKeyError = {
	readonly __typename?: 'DisableApiKeyError'
	readonly code: DisableApiKeyErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum DisableApiKeyErrorCode {
	KeyNotFound = 'KEY_NOT_FOUND'
}

export type DisableApiKeyResponse = {
	readonly __typename?: 'DisableApiKeyResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableApiKeyError>
	readonly error?: Maybe<DisableApiKeyError>
}

export type DisableIdpError = {
	readonly __typename?: 'DisableIDPError'
	readonly code: DisableIdpErrorCode
	readonly developerMessage: Scalars['String']
}

export enum DisableIdpErrorCode {
	NotFound = 'NOT_FOUND'
}

export type DisableIdpResponse = {
	readonly __typename?: 'DisableIDPResponse'
	readonly error?: Maybe<DisableIdpError>
	readonly ok: Scalars['Boolean']
}

export type DisableOtpError = {
	readonly __typename?: 'DisableOtpError'
	readonly code: DisableOtpErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum DisableOtpErrorCode {
	OtpNotActive = 'OTP_NOT_ACTIVE'
}

export type DisableOtpResponse = {
	readonly __typename?: 'DisableOtpResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableOtpError>
	readonly error?: Maybe<DisableOtpError>
}

export type EnableIdpError = {
	readonly __typename?: 'EnableIDPError'
	readonly code: EnableIdpErrorCode
	readonly developerMessage: Scalars['String']
}

export enum EnableIdpErrorCode {
	NotFound = 'NOT_FOUND'
}

export type EnableIdpResponse = {
	readonly __typename?: 'EnableIDPResponse'
	readonly error?: Maybe<EnableIdpError>
	readonly ok: Scalars['Boolean']
}

export type IdpOptions = {
	readonly autoSignUp?: Maybe<Scalars['Boolean']>
}

export type IdpResponseInput = {
	readonly url: Scalars['String']
}

export type Identity = {
	readonly __typename?: 'Identity'
	readonly id: Scalars['String']
	readonly description?: Maybe<Scalars['String']>
	readonly person?: Maybe<Person>
	readonly apiKey?: Maybe<ApiKey>
	readonly projects: ReadonlyArray<IdentityProjectRelation>
	readonly permissions?: Maybe<IdentityGlobalPermissions>
	readonly roles?: Maybe<ReadonlyArray<Scalars['String']>>
}

export type IdentityGlobalPermissions = {
	readonly __typename?: 'IdentityGlobalPermissions'
	readonly canCreateProject: Scalars['Boolean']
}

export type IdentityProjectRelation = {
	readonly __typename?: 'IdentityProjectRelation'
	readonly project: Project
	readonly memberships: ReadonlyArray<Membership>
}

export type IdentityProvider = {
	readonly __typename?: 'IdentityProvider'
	readonly slug: Scalars['String']
	readonly type: Scalars['String']
	readonly configuration: Scalars['Json']
	readonly disabledAt: Scalars['DateTime']
}

export type InitSignInIdpError = {
	readonly __typename?: 'InitSignInIDPError'
	readonly code: InitSignInIdpErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum InitSignInIdpErrorCode {
	ProviderNotFound = 'PROVIDER_NOT_FOUND'
}

export type InitSignInIdpResponse = {
	readonly __typename?: 'InitSignInIDPResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InitSignInIdpError>
	readonly error?: Maybe<InitSignInIdpError>
	readonly result?: Maybe<InitSignInIdpResult>
}

export type InitSignInIdpResult = {
	readonly __typename?: 'InitSignInIDPResult'
	readonly authUrl: Scalars['String']
	readonly sessionData: Scalars['Json']
}

export type InviteError = {
	readonly __typename?: 'InviteError'
	readonly code: InviteErrorCode
	readonly developerMessage: Scalars['String']
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum InviteErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	AlreadyMember = 'ALREADY_MEMBER',
	InvalidMembership = 'INVALID_MEMBERSHIP',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY'
}

export enum InviteMethod {
	CreatePassword = 'CREATE_PASSWORD',
	ResetPassword = 'RESET_PASSWORD'
}

export type InviteOptions = {
	readonly method?: Maybe<InviteMethod>
	readonly mailVariant?: Maybe<Scalars['String']>
}

export type InviteResponse = {
	readonly __typename?: 'InviteResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InviteError>
	readonly error?: Maybe<InviteError>
	readonly result?: Maybe<InviteResult>
}

export type InviteResult = {
	readonly __typename?: 'InviteResult'
	readonly person: Person
	readonly isNew: Scalars['Boolean']
}


export type MailTemplate = {
	readonly projectSlug?: Maybe<Scalars['String']>
	readonly type: MailType
	/** Custom mail variant identifier, e.g. a locale. */
	readonly variant?: Maybe<Scalars['String']>
	readonly subject: Scalars['String']
	readonly content: Scalars['String']
	readonly useLayout?: Maybe<Scalars['Boolean']>
}

export type MailTemplateIdentifier = {
	readonly projectSlug?: Maybe<Scalars['String']>
	readonly type: MailType
	readonly variant?: Maybe<Scalars['String']>
}

export enum MailType {
	ExistingUserInvited = 'EXISTING_USER_INVITED',
	NewUserInvited = 'NEW_USER_INVITED',
	ResetPasswordRequest = 'RESET_PASSWORD_REQUEST'
}

export enum MemberType {
	ApiKey = 'API_KEY',
	Person = 'PERSON'
}

export type Membership = {
	readonly __typename?: 'Membership'
	readonly role: Scalars['String']
	readonly variables: ReadonlyArray<VariableEntry>
}

export type MembershipInput = {
	readonly role: Scalars['String']
	readonly variables: ReadonlyArray<VariableEntryInput>
}

export type MembershipValidationError = {
	readonly __typename?: 'MembershipValidationError'
	readonly code: MembershipValidationErrorCode
	readonly role: Scalars['String']
	readonly variable?: Maybe<Scalars['String']>
}

export enum MembershipValidationErrorCode {
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY'
}

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly signUp?: Maybe<SignUpResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly createSessionToken?: Maybe<CreateSessionTokenResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly changeMyPassword?: Maybe<ChangeMyPasswordResponse>
	readonly initSignInIDP?: Maybe<InitSignInIdpResponse>
	readonly signInIDP?: Maybe<SignInIdpResponse>
	readonly addIDP?: Maybe<AddIdpResponse>
	readonly updateIDP?: Maybe<UpdateIdpResponse>
	readonly disableIDP?: Maybe<DisableIdpResponse>
	readonly enableIDP?: Maybe<EnableIdpResponse>
	readonly prepareOtp?: Maybe<PrepareOtpResponse>
	readonly confirmOtp?: Maybe<ConfirmOtpResponse>
	readonly disableOtp?: Maybe<DisableOtpResponse>
	readonly createResetPasswordRequest?: Maybe<CreatePasswordResetRequestResponse>
	readonly resetPassword?: Maybe<ResetPasswordResponse>
	readonly invite?: Maybe<InviteResponse>
	readonly unmanagedInvite?: Maybe<InviteResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
	readonly createGlobalApiKey?: Maybe<CreateApiKeyResponse>
	readonly disableApiKey?: Maybe<DisableApiKeyResponse>
	readonly addMailTemplate?: Maybe<AddMailTemplateResponse>
	readonly removeMailTemplate?: Maybe<RemoveMailTemplateResponse>
	readonly createProject?: Maybe<CreateProjectResponse>
	readonly setProjectSecret?: Maybe<SetProjectSecretResponse>
	readonly updateProject?: Maybe<UpdateProjectResponse>
	/** @deprecated use addMailtemplate */
	readonly addProjectMailTemplate?: Maybe<AddMailTemplateResponse>
	/** @deprecated use removeMailtemplate */
	readonly removeProjectMailTemplate?: Maybe<RemoveMailTemplateResponse>
}


export type MutationSignUpArgs = {
	email: Scalars['String']
	password?: Maybe<Scalars['String']>
	passwordHash?: Maybe<Scalars['String']>
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
}


export type MutationSignInArgs = {
	email: Scalars['String']
	password: Scalars['String']
	expiration?: Maybe<Scalars['Int']>
	otpToken?: Maybe<Scalars['String']>
}


export type MutationCreateSessionTokenArgs = {
	email: Scalars['String']
	expiration?: Maybe<Scalars['Int']>
}


export type MutationSignOutArgs = {
	all?: Maybe<Scalars['Boolean']>
}


export type MutationChangePasswordArgs = {
	personId: Scalars['String']
	password: Scalars['String']
}


export type MutationChangeMyPasswordArgs = {
	currentPassword: Scalars['String']
	newPassword: Scalars['String']
}


export type MutationInitSignInIdpArgs = {
	identityProvider: Scalars['String']
	redirectUrl: Scalars['String']
}


export type MutationSignInIdpArgs = {
	identityProvider: Scalars['String']
	idpResponse: IdpResponseInput
	redirectUrl: Scalars['String']
	sessionData: Scalars['Json']
	expiration?: Maybe<Scalars['Int']>
}


export type MutationAddIdpArgs = {
	identityProvider: Scalars['String']
	type: Scalars['String']
	configuration: Scalars['Json']
	options?: Maybe<IdpOptions>
}


export type MutationUpdateIdpArgs = {
	identityProvider: Scalars['String']
	configuration?: Maybe<Scalars['Json']>
	options?: Maybe<IdpOptions>
}


export type MutationDisableIdpArgs = {
	identityProvider: Scalars['String']
}


export type MutationEnableIdpArgs = {
	identityProvider: Scalars['String']
}


export type MutationPrepareOtpArgs = {
	label?: Maybe<Scalars['String']>
}


export type MutationConfirmOtpArgs = {
	otpToken: Scalars['String']
}


export type MutationCreateResetPasswordRequestArgs = {
	email: Scalars['String']
	options?: Maybe<CreateResetPasswordRequestOptions>
}


export type MutationResetPasswordArgs = {
	token: Scalars['String']
	password: Scalars['String']
}


export type MutationInviteArgs = {
	email: Scalars['String']
	projectSlug: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
	options?: Maybe<InviteOptions>
}


export type MutationUnmanagedInviteArgs = {
	email: Scalars['String']
	projectSlug: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
	options?: Maybe<UnmanagedInviteOptions>
	password?: Maybe<Scalars['String']>
}


export type MutationAddProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
}


export type MutationRemoveProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
}


export type MutationUpdateProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
}


export type MutationCreateApiKeyArgs = {
	projectSlug: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
	description: Scalars['String']
	tokenHash?: Maybe<Scalars['String']>
}


export type MutationCreateGlobalApiKeyArgs = {
	description: Scalars['String']
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
	tokenHash?: Maybe<Scalars['String']>
}


export type MutationDisableApiKeyArgs = {
	id: Scalars['String']
}


export type MutationAddMailTemplateArgs = {
	template: MailTemplate
}


export type MutationRemoveMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}


export type MutationCreateProjectArgs = {
	projectSlug: Scalars['String']
	name?: Maybe<Scalars['String']>
	config?: Maybe<Scalars['Json']>
	secrets?: Maybe<ReadonlyArray<ProjectSecret>>
	deployTokenHash?: Maybe<Scalars['String']>
}


export type MutationSetProjectSecretArgs = {
	projectSlug: Scalars['String']
	key: Scalars['String']
	value: Scalars['String']
}


export type MutationUpdateProjectArgs = {
	projectSlug: Scalars['String']
	name?: Maybe<Scalars['String']>
	config?: Maybe<Scalars['Json']>
	mergeConfig?: Maybe<Scalars['Boolean']>
}


export type MutationAddProjectMailTemplateArgs = {
	template: MailTemplate
}


export type MutationRemoveProjectMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}

export type Person = {
	readonly __typename?: 'Person'
	readonly id: Scalars['String']
	readonly email: Scalars['String']
	readonly otpEnabled: Scalars['Boolean']
	readonly identity: Identity
}

export type PrepareOtpResponse = {
	readonly __typename?: 'PrepareOtpResponse'
	readonly ok: Scalars['Boolean']
	readonly result?: Maybe<PrepareOtpResult>
}

export type PrepareOtpResult = {
	readonly __typename?: 'PrepareOtpResult'
	readonly otpUri: Scalars['String']
	readonly otpSecret: Scalars['String']
}

export type Project = {
	readonly __typename?: 'Project'
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
	readonly config: Scalars['Json']
	readonly roles: ReadonlyArray<RoleDefinition>
	readonly members: ReadonlyArray<ProjectIdentityRelation>
}


export type ProjectMembersArgs = {
	memberType?: Maybe<MemberType>
}

export type ProjectIdentityRelation = {
	readonly __typename?: 'ProjectIdentityRelation'
	readonly identity: Identity
	readonly memberships: ReadonlyArray<Membership>
}

export type ProjectSecret = {
	readonly key: Scalars['String']
	readonly value: Scalars['String']
}

export type Query = {
	readonly __typename?: 'Query'
	readonly me: Identity
	readonly projects: ReadonlyArray<Project>
	readonly projectBySlug?: Maybe<Project>
	readonly projectMemberships: ReadonlyArray<Membership>
	readonly checkResetPasswordToken: CheckResetPasswordTokenCode
	readonly identityProviders: ReadonlyArray<IdentityProvider>
}


export type QueryProjectBySlugArgs = {
	slug: Scalars['String']
}


export type QueryProjectMembershipsArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
}


export type QueryCheckResetPasswordTokenArgs = {
	requestId: Scalars['String']
	token: Scalars['String']
}

export type RemoveMailTemplateError = {
	readonly __typename?: 'RemoveMailTemplateError'
	readonly code: RemoveMailTemplateErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum RemoveMailTemplateErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	TemplateNotFound = 'TEMPLATE_NOT_FOUND'
}

export type RemoveMailTemplateResponse = {
	readonly __typename?: 'RemoveMailTemplateResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveMailTemplateError>
	readonly error?: Maybe<RemoveMailTemplateError>
}

export type RemoveProjectMemberError = {
	readonly __typename?: 'RemoveProjectMemberError'
	readonly code: RemoveProjectMemberErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum RemoveProjectMemberErrorCode {
	NotMember = 'NOT_MEMBER',
	ProjectNotFound = 'PROJECT_NOT_FOUND'
}

export type RemoveProjectMemberResponse = {
	readonly __typename?: 'RemoveProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
	readonly error?: Maybe<RemoveProjectMemberError>
}

export type ResetPasswordError = {
	readonly __typename?: 'ResetPasswordError'
	readonly code: ResetPasswordErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum ResetPasswordErrorCode {
	TokenNotFound = 'TOKEN_NOT_FOUND',
	TokenUsed = 'TOKEN_USED',
	TokenExpired = 'TOKEN_EXPIRED',
	PasswordTooWeak = 'PASSWORD_TOO_WEAK'
}

export type ResetPasswordResponse = {
	readonly __typename?: 'ResetPasswordResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ResetPasswordError>
	readonly error?: Maybe<ResetPasswordError>
}

export type RoleDefinition = {
	readonly __typename?: 'RoleDefinition'
	readonly name: Scalars['String']
	readonly variables: ReadonlyArray<RoleVariableDefinition>
}

export type RoleEntityVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RoleEntityVariableDefinition'
	readonly name: Scalars['String']
	readonly entityName: Scalars['String']
}

export type RolePredefinedVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RolePredefinedVariableDefinition'
	readonly name: Scalars['String']
	readonly value: Scalars['String']
}

export type RoleVariableDefinition = {
	readonly name: Scalars['String']
}

export type SetProjectSecretResponse = {
	readonly __typename?: 'SetProjectSecretResponse'
	readonly ok: Scalars['Boolean']
}

export type SignInError = {
	readonly __typename?: 'SignInError'
	readonly code: SignInErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum SignInErrorCode {
	UnknownEmail = 'UNKNOWN_EMAIL',
	InvalidPassword = 'INVALID_PASSWORD',
	NoPasswordSet = 'NO_PASSWORD_SET',
	OtpRequired = 'OTP_REQUIRED',
	InvalidOtpToken = 'INVALID_OTP_TOKEN'
}

export type SignInIdpError = {
	readonly __typename?: 'SignInIDPError'
	readonly code: SignInIdpErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum SignInIdpErrorCode {
	InvalidIdpResponse = 'INVALID_IDP_RESPONSE',
	IdpValidationFailed = 'IDP_VALIDATION_FAILED',
	PersonNotFound = 'PERSON_NOT_FOUND'
}

export type SignInIdpResponse = {
	readonly __typename?: 'SignInIDPResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInIdpError>
	readonly error?: Maybe<SignInIdpError>
	readonly result?: Maybe<SignInIdpResult>
}

export type SignInIdpResult = CommonSignInResult & {
	readonly __typename?: 'SignInIDPResult'
	readonly token: Scalars['String']
	readonly person: Person
}

export type SignInResponse = {
	readonly __typename?: 'SignInResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInError>
	readonly error?: Maybe<SignInError>
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = CommonSignInResult & {
	readonly __typename?: 'SignInResult'
	readonly token: Scalars['String']
	readonly person: Person
}

export type SignOutError = {
	readonly __typename?: 'SignOutError'
	readonly code: SignOutErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum SignOutErrorCode {
	NotAPerson = 'NOT_A_PERSON'
}

export type SignOutResponse = {
	readonly __typename?: 'SignOutResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignOutError>
	readonly error?: Maybe<SignOutError>
}

export type SignUpError = {
	readonly __typename?: 'SignUpError'
	readonly code: SignUpErrorCode
	readonly developerMessage: Scalars['String']
	/** @deprecated Field no longer supported */
	readonly endPersonMessage?: Maybe<Scalars['String']>
}

export enum SignUpErrorCode {
	EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
	TooWeak = 'TOO_WEAK'
}

export type SignUpResponse = {
	readonly __typename?: 'SignUpResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignUpError>
	readonly error?: Maybe<SignUpError>
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	readonly __typename?: 'SignUpResult'
	readonly person: Person
}

export type UnmanagedInviteOptions = {
	readonly password?: Maybe<Scalars['String']>
	readonly resetTokenHash?: Maybe<Scalars['String']>
}

export type UpdateIdpError = {
	readonly __typename?: 'UpdateIDPError'
	readonly code: UpdateIdpErrorCode
	readonly developerMessage: Scalars['String']
}

export enum UpdateIdpErrorCode {
	NotFound = 'NOT_FOUND',
	InvalidConfiguration = 'INVALID_CONFIGURATION'
}

export type UpdateIdpResponse = {
	readonly __typename?: 'UpdateIDPResponse'
	readonly error?: Maybe<UpdateIdpError>
	readonly ok: Scalars['Boolean']
}

export type UpdateProjectMemberError = {
	readonly __typename?: 'UpdateProjectMemberError'
	readonly code: UpdateProjectMemberErrorCode
	readonly developerMessage: Scalars['String']
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']>
}

export enum UpdateProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	NotMember = 'NOT_MEMBER',
	InvalidMembership = 'INVALID_MEMBERSHIP',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	VariableNotFound = 'VARIABLE_NOT_FOUND'
}

export type UpdateProjectMemberResponse = {
	readonly __typename?: 'UpdateProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
	readonly error?: Maybe<UpdateProjectMemberError>
}

export type UpdateProjectResponse = {
	readonly __typename?: 'UpdateProjectResponse'
	readonly ok: Scalars['Boolean']
}

export type VariableEntry = {
	readonly __typename?: 'VariableEntry'
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

export type VariableEntryInput = {
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}



export type ResolverTypeWrapper<T> = Promise<T> | T


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
	fragment: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
	selectionSet: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
	resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	AddIDPError: ResolverTypeWrapper<AddIdpError>
	String: ResolverTypeWrapper<Scalars['String']>
	AddIDPErrorCode: AddIdpErrorCode
	AddIDPResponse: ResolverTypeWrapper<AddIdpResponse>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	AddMailTemplateError: ResolverTypeWrapper<AddMailTemplateError>
	AddMailTemplateErrorCode: AddMailTemplateErrorCode
	AddMailTemplateResponse: ResolverTypeWrapper<AddMailTemplateResponse>
	AddProjectMemberError: ResolverTypeWrapper<AddProjectMemberError>
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	AddProjectMemberResponse: ResolverTypeWrapper<AddProjectMemberResponse>
	ApiKey: ResolverTypeWrapper<ApiKey>
	ApiKeyWithToken: ResolverTypeWrapper<ApiKeyWithToken>
	ChangeMyPasswordError: ResolverTypeWrapper<ChangeMyPasswordError>
	ChangeMyPasswordErrorCode: ChangeMyPasswordErrorCode
	ChangeMyPasswordResponse: ResolverTypeWrapper<ChangeMyPasswordResponse>
	ChangePasswordError: ResolverTypeWrapper<ChangePasswordError>
	ChangePasswordErrorCode: ChangePasswordErrorCode
	ChangePasswordResponse: ResolverTypeWrapper<ChangePasswordResponse>
	CheckResetPasswordTokenCode: CheckResetPasswordTokenCode
	CheckResetPasswordTokenResult: ResolverTypeWrapper<CheckResetPasswordTokenResult>
	CommonSignInResult: ResolversTypes['CreateSessionTokenResult'] | ResolversTypes['SignInIDPResult'] | ResolversTypes['SignInResult']
	ConfirmOtpError: ResolverTypeWrapper<ConfirmOtpError>
	ConfirmOtpErrorCode: ConfirmOtpErrorCode
	ConfirmOtpResponse: ResolverTypeWrapper<ConfirmOtpResponse>
	CreateApiKeyError: ResolverTypeWrapper<CreateApiKeyError>
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResponse: ResolverTypeWrapper<CreateApiKeyResponse>
	CreateApiKeyResult: ResolverTypeWrapper<CreateApiKeyResult>
	CreatePasswordResetRequestError: ResolverTypeWrapper<CreatePasswordResetRequestError>
	CreatePasswordResetRequestErrorCode: CreatePasswordResetRequestErrorCode
	CreatePasswordResetRequestResponse: ResolverTypeWrapper<CreatePasswordResetRequestResponse>
	CreateProjectResponse: ResolverTypeWrapper<CreateProjectResponse>
	CreateProjectResponseError: ResolverTypeWrapper<CreateProjectResponseError>
	CreateProjectResponseErrorCode: CreateProjectResponseErrorCode
	CreateProjectResult: ResolverTypeWrapper<CreateProjectResult>
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: ResolverTypeWrapper<CreateSessionTokenError>
	CreateSessionTokenErrorCode: CreateSessionTokenErrorCode
	CreateSessionTokenResponse: ResolverTypeWrapper<CreateSessionTokenResponse>
	CreateSessionTokenResult: ResolverTypeWrapper<CreateSessionTokenResult>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']>
	DisableApiKeyError: ResolverTypeWrapper<DisableApiKeyError>
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	DisableApiKeyResponse: ResolverTypeWrapper<DisableApiKeyResponse>
	DisableIDPError: ResolverTypeWrapper<DisableIdpError>
	DisableIDPErrorCode: DisableIdpErrorCode
	DisableIDPResponse: ResolverTypeWrapper<DisableIdpResponse>
	DisableOtpError: ResolverTypeWrapper<DisableOtpError>
	DisableOtpErrorCode: DisableOtpErrorCode
	DisableOtpResponse: ResolverTypeWrapper<DisableOtpResponse>
	EnableIDPError: ResolverTypeWrapper<EnableIdpError>
	EnableIDPErrorCode: EnableIdpErrorCode
	EnableIDPResponse: ResolverTypeWrapper<EnableIdpResponse>
	IDPOptions: IdpOptions
	IDPResponseInput: IdpResponseInput
	Identity: ResolverTypeWrapper<Identity>
	IdentityGlobalPermissions: ResolverTypeWrapper<IdentityGlobalPermissions>
	IdentityProjectRelation: ResolverTypeWrapper<IdentityProjectRelation>
	IdentityProvider: ResolverTypeWrapper<IdentityProvider>
	InitSignInIDPError: ResolverTypeWrapper<InitSignInIdpError>
	InitSignInIDPErrorCode: InitSignInIdpErrorCode
	InitSignInIDPResponse: ResolverTypeWrapper<InitSignInIdpResponse>
	InitSignInIDPResult: ResolverTypeWrapper<InitSignInIdpResult>
	InviteError: ResolverTypeWrapper<InviteError>
	InviteErrorCode: InviteErrorCode
	InviteMethod: InviteMethod
	InviteOptions: InviteOptions
	InviteResponse: ResolverTypeWrapper<InviteResponse>
	InviteResult: ResolverTypeWrapper<InviteResult>
	Json: ResolverTypeWrapper<Scalars['Json']>
	MailTemplate: MailTemplate
	MailTemplateIdentifier: MailTemplateIdentifier
	MailType: MailType
	MemberType: MemberType
	Membership: ResolverTypeWrapper<Membership>
	MembershipInput: MembershipInput
	MembershipValidationError: ResolverTypeWrapper<MembershipValidationError>
	MembershipValidationErrorCode: MembershipValidationErrorCode
	Mutation: ResolverTypeWrapper<{}>
	Int: ResolverTypeWrapper<Scalars['Int']>
	Person: ResolverTypeWrapper<Person>
	PrepareOtpResponse: ResolverTypeWrapper<PrepareOtpResponse>
	PrepareOtpResult: ResolverTypeWrapper<PrepareOtpResult>
	Project: ResolverTypeWrapper<Project>
	ProjectIdentityRelation: ResolverTypeWrapper<ProjectIdentityRelation>
	ProjectSecret: ProjectSecret
	Query: ResolverTypeWrapper<{}>
	RemoveMailTemplateError: ResolverTypeWrapper<RemoveMailTemplateError>
	RemoveMailTemplateErrorCode: RemoveMailTemplateErrorCode
	RemoveMailTemplateResponse: ResolverTypeWrapper<RemoveMailTemplateResponse>
	RemoveProjectMemberError: ResolverTypeWrapper<RemoveProjectMemberError>
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	RemoveProjectMemberResponse: ResolverTypeWrapper<RemoveProjectMemberResponse>
	ResetPasswordError: ResolverTypeWrapper<ResetPasswordError>
	ResetPasswordErrorCode: ResetPasswordErrorCode
	ResetPasswordResponse: ResolverTypeWrapper<ResetPasswordResponse>
	RoleDefinition: ResolverTypeWrapper<RoleDefinition>
	RoleEntityVariableDefinition: ResolverTypeWrapper<RoleEntityVariableDefinition>
	RolePredefinedVariableDefinition: ResolverTypeWrapper<RolePredefinedVariableDefinition>
	RoleVariableDefinition: ResolversTypes['RoleEntityVariableDefinition'] | ResolversTypes['RolePredefinedVariableDefinition']
	SetProjectSecretResponse: ResolverTypeWrapper<SetProjectSecretResponse>
	SignInError: ResolverTypeWrapper<SignInError>
	SignInErrorCode: SignInErrorCode
	SignInIDPError: ResolverTypeWrapper<SignInIdpError>
	SignInIDPErrorCode: SignInIdpErrorCode
	SignInIDPResponse: ResolverTypeWrapper<SignInIdpResponse>
	SignInIDPResult: ResolverTypeWrapper<SignInIdpResult>
	SignInResponse: ResolverTypeWrapper<SignInResponse>
	SignInResult: ResolverTypeWrapper<SignInResult>
	SignOutError: ResolverTypeWrapper<SignOutError>
	SignOutErrorCode: SignOutErrorCode
	SignOutResponse: ResolverTypeWrapper<SignOutResponse>
	SignUpError: ResolverTypeWrapper<SignUpError>
	SignUpErrorCode: SignUpErrorCode
	SignUpResponse: ResolverTypeWrapper<SignUpResponse>
	SignUpResult: ResolverTypeWrapper<SignUpResult>
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateIDPError: ResolverTypeWrapper<UpdateIdpError>
	UpdateIDPErrorCode: UpdateIdpErrorCode
	UpdateIDPResponse: ResolverTypeWrapper<UpdateIdpResponse>
	UpdateProjectMemberError: ResolverTypeWrapper<UpdateProjectMemberError>
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	UpdateProjectMemberResponse: ResolverTypeWrapper<UpdateProjectMemberResponse>
	UpdateProjectResponse: ResolverTypeWrapper<UpdateProjectResponse>
	VariableEntry: ResolverTypeWrapper<VariableEntry>
	VariableEntryInput: VariableEntryInput
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	AddIDPError: AddIdpError
	String: Scalars['String']
	AddIDPResponse: AddIdpResponse
	Boolean: Scalars['Boolean']
	AddMailTemplateError: AddMailTemplateError
	AddMailTemplateResponse: AddMailTemplateResponse
	AddProjectMemberError: AddProjectMemberError
	AddProjectMemberResponse: AddProjectMemberResponse
	ApiKey: ApiKey
	ApiKeyWithToken: ApiKeyWithToken
	ChangeMyPasswordError: ChangeMyPasswordError
	ChangeMyPasswordResponse: ChangeMyPasswordResponse
	ChangePasswordError: ChangePasswordError
	ChangePasswordResponse: ChangePasswordResponse
	CheckResetPasswordTokenResult: CheckResetPasswordTokenResult
	CommonSignInResult: ResolversParentTypes['CreateSessionTokenResult'] | ResolversParentTypes['SignInIDPResult'] | ResolversParentTypes['SignInResult']
	ConfirmOtpError: ConfirmOtpError
	ConfirmOtpResponse: ConfirmOtpResponse
	CreateApiKeyError: CreateApiKeyError
	CreateApiKeyResponse: CreateApiKeyResponse
	CreateApiKeyResult: CreateApiKeyResult
	CreatePasswordResetRequestError: CreatePasswordResetRequestError
	CreatePasswordResetRequestResponse: CreatePasswordResetRequestResponse
	CreateProjectResponse: CreateProjectResponse
	CreateProjectResponseError: CreateProjectResponseError
	CreateProjectResult: CreateProjectResult
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: CreateSessionTokenError
	CreateSessionTokenResponse: CreateSessionTokenResponse
	CreateSessionTokenResult: CreateSessionTokenResult
	DateTime: Scalars['DateTime']
	DisableApiKeyError: DisableApiKeyError
	DisableApiKeyResponse: DisableApiKeyResponse
	DisableIDPError: DisableIdpError
	DisableIDPResponse: DisableIdpResponse
	DisableOtpError: DisableOtpError
	DisableOtpResponse: DisableOtpResponse
	EnableIDPError: EnableIdpError
	EnableIDPResponse: EnableIdpResponse
	IDPOptions: IdpOptions
	IDPResponseInput: IdpResponseInput
	Identity: Identity
	IdentityGlobalPermissions: IdentityGlobalPermissions
	IdentityProjectRelation: IdentityProjectRelation
	IdentityProvider: IdentityProvider
	InitSignInIDPError: InitSignInIdpError
	InitSignInIDPResponse: InitSignInIdpResponse
	InitSignInIDPResult: InitSignInIdpResult
	InviteError: InviteError
	InviteOptions: InviteOptions
	InviteResponse: InviteResponse
	InviteResult: InviteResult
	Json: Scalars['Json']
	MailTemplate: MailTemplate
	MailTemplateIdentifier: MailTemplateIdentifier
	Membership: Membership
	MembershipInput: MembershipInput
	MembershipValidationError: MembershipValidationError
	Mutation: {}
	Int: Scalars['Int']
	Person: Person
	PrepareOtpResponse: PrepareOtpResponse
	PrepareOtpResult: PrepareOtpResult
	Project: Project
	ProjectIdentityRelation: ProjectIdentityRelation
	ProjectSecret: ProjectSecret
	Query: {}
	RemoveMailTemplateError: RemoveMailTemplateError
	RemoveMailTemplateResponse: RemoveMailTemplateResponse
	RemoveProjectMemberError: RemoveProjectMemberError
	RemoveProjectMemberResponse: RemoveProjectMemberResponse
	ResetPasswordError: ResetPasswordError
	ResetPasswordResponse: ResetPasswordResponse
	RoleDefinition: RoleDefinition
	RoleEntityVariableDefinition: RoleEntityVariableDefinition
	RolePredefinedVariableDefinition: RolePredefinedVariableDefinition
	RoleVariableDefinition: ResolversParentTypes['RoleEntityVariableDefinition'] | ResolversParentTypes['RolePredefinedVariableDefinition']
	SetProjectSecretResponse: SetProjectSecretResponse
	SignInError: SignInError
	SignInIDPError: SignInIdpError
	SignInIDPResponse: SignInIdpResponse
	SignInIDPResult: SignInIdpResult
	SignInResponse: SignInResponse
	SignInResult: SignInResult
	SignOutError: SignOutError
	SignOutResponse: SignOutResponse
	SignUpError: SignUpError
	SignUpResponse: SignUpResponse
	SignUpResult: SignUpResult
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateIDPError: UpdateIdpError
	UpdateIDPResponse: UpdateIdpResponse
	UpdateProjectMemberError: UpdateProjectMemberError
	UpdateProjectMemberResponse: UpdateProjectMemberResponse
	UpdateProjectResponse: UpdateProjectResponse
	VariableEntry: VariableEntry
	VariableEntryInput: VariableEntryInput
}

export type AddIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddIDPError'] = ResolversParentTypes['AddIDPError']> = {
	code?: Resolver<ResolversTypes['AddIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddIDPResponse'] = ResolversParentTypes['AddIDPResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['AddIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddMailTemplateErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddMailTemplateError'] = ResolversParentTypes['AddMailTemplateError']> = {
	code?: Resolver<ResolversTypes['AddMailTemplateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddMailTemplateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddMailTemplateResponse'] = ResolversParentTypes['AddMailTemplateResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddProjectMemberError'] = ResolversParentTypes['AddProjectMemberError']> = {
	code?: Resolver<ResolversTypes['AddProjectMemberErrorCode'], ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddProjectMemberResponse'] = ResolversParentTypes['AddProjectMemberResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ApiKeyResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ApiKeyWithTokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiKeyWithToken'] = ResolversParentTypes['ApiKeyWithToken']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyPasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyPasswordError'] = ResolversParentTypes['ChangeMyPasswordError']> = {
	code?: Resolver<ResolversTypes['ChangeMyPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyPasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyPasswordResponse'] = ResolversParentTypes['ChangeMyPasswordResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ChangeMyPasswordError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangePasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangePasswordError'] = ResolversParentTypes['ChangePasswordError']> = {
	code?: Resolver<ResolversTypes['ChangePasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangePasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangePasswordResponse'] = ResolversParentTypes['ChangePasswordResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CheckResetPasswordTokenResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CheckResetPasswordTokenResult'] = ResolversParentTypes['CheckResetPasswordTokenResult']> = {
	code?: Resolver<ResolversTypes['CheckResetPasswordTokenCode'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CommonSignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommonSignInResult'] = ResolversParentTypes['CommonSignInResult']> = {
	__resolveType: TypeResolveFn<'CreateSessionTokenResult' | 'SignInIDPResult' | 'SignInResult', ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
}

export type ConfirmOtpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfirmOtpError'] = ResolversParentTypes['ConfirmOtpError']> = {
	code?: Resolver<ResolversTypes['ConfirmOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfirmOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfirmOtpResponse'] = ResolversParentTypes['ConfirmOtpResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateApiKeyErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateApiKeyError'] = ResolversParentTypes['CreateApiKeyError']> = {
	code?: Resolver<ResolversTypes['CreateApiKeyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateApiKeyResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateApiKeyResponse'] = ResolversParentTypes['CreateApiKeyResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateApiKeyResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateApiKeyResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateApiKeyResult'] = ResolversParentTypes['CreateApiKeyResult']> = {
	apiKey?: Resolver<ResolversTypes['ApiKeyWithToken'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreatePasswordResetRequestErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreatePasswordResetRequestError'] = ResolversParentTypes['CreatePasswordResetRequestError']> = {
	code?: Resolver<ResolversTypes['CreatePasswordResetRequestErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreatePasswordResetRequestResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreatePasswordResetRequestResponse'] = ResolversParentTypes['CreatePasswordResetRequestResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResponse'] = ResolversParentTypes['CreateProjectResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['CreateProjectResponseError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateProjectResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResponseErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResponseError'] = ResolversParentTypes['CreateProjectResponseError']> = {
	code?: Resolver<ResolversTypes['CreateProjectResponseErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResult'] = ResolversParentTypes['CreateProjectResult']> = {
	deployerApiKey?: Resolver<ResolversTypes['ApiKeyWithToken'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenError'] = ResolversParentTypes['CreateSessionTokenError']> = {
	code?: Resolver<ResolversTypes['CreateSessionTokenErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenResponse'] = ResolversParentTypes['CreateSessionTokenResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['CreateSessionTokenError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenResult'] = ResolversParentTypes['CreateSessionTokenResult']> = {
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export type DisableApiKeyErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableApiKeyError'] = ResolversParentTypes['DisableApiKeyError']> = {
	code?: Resolver<ResolversTypes['DisableApiKeyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisableApiKeyResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableApiKeyResponse'] = ResolversParentTypes['DisableApiKeyResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisableIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableIDPError'] = ResolversParentTypes['DisableIDPError']> = {
	code?: Resolver<ResolversTypes['DisableIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisableIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableIDPResponse'] = ResolversParentTypes['DisableIDPResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['DisableIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisableOtpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableOtpError'] = ResolversParentTypes['DisableOtpError']> = {
	code?: Resolver<ResolversTypes['DisableOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisableOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisableOtpResponse'] = ResolversParentTypes['DisableOtpResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type EnableIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnableIDPError'] = ResolversParentTypes['EnableIDPError']> = {
	code?: Resolver<ResolversTypes['EnableIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type EnableIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnableIDPResponse'] = ResolversParentTypes['EnableIDPResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['EnableIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	person?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType>
	apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['IdentityProjectRelation']>, ParentType, ContextType>
	permissions?: Resolver<Maybe<ResolversTypes['IdentityGlobalPermissions']>, ParentType, ContextType>
	roles?: Resolver<Maybe<ReadonlyArray<ResolversTypes['String']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityGlobalPermissionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityGlobalPermissions'] = ResolversParentTypes['IdentityGlobalPermissions']> = {
	canCreateProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityProjectRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityProjectRelation'] = ResolversParentTypes['IdentityProjectRelation']> = {
	project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityProviderResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityProvider'] = ResolversParentTypes['IdentityProvider']> = {
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	configuration?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	disabledAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPError'] = ResolversParentTypes['InitSignInIDPError']> = {
	code?: Resolver<ResolversTypes['InitSignInIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPResponse'] = ResolversParentTypes['InitSignInIDPResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InitSignInIDPResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPResult'] = ResolversParentTypes['InitSignInIDPResult']> = {
	authUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	sessionData?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteError'] = ResolversParentTypes['InviteError']> = {
	code?: Resolver<ResolversTypes['InviteErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteResponse'] = ResolversParentTypes['InviteResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InviteError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['InviteError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InviteResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteResult'] = ResolversParentTypes['InviteResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	isNew?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MembershipResolvers<ContextType = any, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = {
	role?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['VariableEntry']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MembershipValidationErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MembershipValidationError'] = ResolversParentTypes['MembershipValidationError']> = {
	code?: Resolver<ResolversTypes['MembershipValidationErrorCode'], ParentType, ContextType>
	role?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variable?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	signUp?: Resolver<Maybe<ResolversTypes['SignUpResponse']>, ParentType, ContextType, RequireFields<MutationSignUpArgs, 'email'>>
	signIn?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationSignInArgs, 'email' | 'password'>>
	createSessionToken?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResponse']>, ParentType, ContextType, RequireFields<MutationCreateSessionTokenArgs, 'email'>>
	signOut?: Resolver<Maybe<ResolversTypes['SignOutResponse']>, ParentType, ContextType, RequireFields<MutationSignOutArgs, never>>
	changePassword?: Resolver<Maybe<ResolversTypes['ChangePasswordResponse']>, ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'personId' | 'password'>>
	changeMyPassword?: Resolver<Maybe<ResolversTypes['ChangeMyPasswordResponse']>, ParentType, ContextType, RequireFields<MutationChangeMyPasswordArgs, 'currentPassword' | 'newPassword'>>
	initSignInIDP?: Resolver<Maybe<ResolversTypes['InitSignInIDPResponse']>, ParentType, ContextType, RequireFields<MutationInitSignInIdpArgs, 'identityProvider' | 'redirectUrl'>>
	signInIDP?: Resolver<Maybe<ResolversTypes['SignInIDPResponse']>, ParentType, ContextType, RequireFields<MutationSignInIdpArgs, 'identityProvider' | 'idpResponse' | 'redirectUrl' | 'sessionData'>>
	addIDP?: Resolver<Maybe<ResolversTypes['AddIDPResponse']>, ParentType, ContextType, RequireFields<MutationAddIdpArgs, 'identityProvider' | 'type' | 'configuration'>>
	updateIDP?: Resolver<Maybe<ResolversTypes['UpdateIDPResponse']>, ParentType, ContextType, RequireFields<MutationUpdateIdpArgs, 'identityProvider'>>
	disableIDP?: Resolver<Maybe<ResolversTypes['DisableIDPResponse']>, ParentType, ContextType, RequireFields<MutationDisableIdpArgs, 'identityProvider'>>
	enableIDP?: Resolver<Maybe<ResolversTypes['EnableIDPResponse']>, ParentType, ContextType, RequireFields<MutationEnableIdpArgs, 'identityProvider'>>
	prepareOtp?: Resolver<Maybe<ResolversTypes['PrepareOtpResponse']>, ParentType, ContextType, RequireFields<MutationPrepareOtpArgs, never>>
	confirmOtp?: Resolver<Maybe<ResolversTypes['ConfirmOtpResponse']>, ParentType, ContextType, RequireFields<MutationConfirmOtpArgs, 'otpToken'>>
	disableOtp?: Resolver<Maybe<ResolversTypes['DisableOtpResponse']>, ParentType, ContextType>
	createResetPasswordRequest?: Resolver<Maybe<ResolversTypes['CreatePasswordResetRequestResponse']>, ParentType, ContextType, RequireFields<MutationCreateResetPasswordRequestArgs, 'email'>>
	resetPassword?: Resolver<Maybe<ResolversTypes['ResetPasswordResponse']>, ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'token' | 'password'>>
	invite?: Resolver<Maybe<ResolversTypes['InviteResponse']>, ParentType, ContextType, RequireFields<MutationInviteArgs, 'email' | 'projectSlug' | 'memberships'>>
	unmanagedInvite?: Resolver<Maybe<ResolversTypes['InviteResponse']>, ParentType, ContextType, RequireFields<MutationUnmanagedInviteArgs, 'email' | 'projectSlug' | 'memberships'>>
	addProjectMember?: Resolver<Maybe<ResolversTypes['AddProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationAddProjectMemberArgs, 'projectSlug' | 'identityId' | 'memberships'>>
	removeProjectMember?: Resolver<Maybe<ResolversTypes['RemoveProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationRemoveProjectMemberArgs, 'projectSlug' | 'identityId'>>
	updateProjectMember?: Resolver<Maybe<ResolversTypes['UpdateProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationUpdateProjectMemberArgs, 'projectSlug' | 'identityId' | 'memberships'>>
	createApiKey?: Resolver<Maybe<ResolversTypes['CreateApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'projectSlug' | 'memberships' | 'description'>>
	createGlobalApiKey?: Resolver<Maybe<ResolversTypes['CreateApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationCreateGlobalApiKeyArgs, 'description'>>
	disableApiKey?: Resolver<Maybe<ResolversTypes['DisableApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationDisableApiKeyArgs, 'id'>>
	addMailTemplate?: Resolver<Maybe<ResolversTypes['AddMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationAddMailTemplateArgs, 'template'>>
	removeMailTemplate?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationRemoveMailTemplateArgs, 'templateIdentifier'>>
	createProject?: Resolver<Maybe<ResolversTypes['CreateProjectResponse']>, ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'projectSlug'>>
	setProjectSecret?: Resolver<Maybe<ResolversTypes['SetProjectSecretResponse']>, ParentType, ContextType, RequireFields<MutationSetProjectSecretArgs, 'projectSlug' | 'key' | 'value'>>
	updateProject?: Resolver<Maybe<ResolversTypes['UpdateProjectResponse']>, ParentType, ContextType, RequireFields<MutationUpdateProjectArgs, 'projectSlug'>>
	addProjectMailTemplate?: Resolver<Maybe<ResolversTypes['AddMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationAddProjectMailTemplateArgs, 'template'>>
	removeProjectMailTemplate?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationRemoveProjectMailTemplateArgs, 'templateIdentifier'>>
}

export type PersonResolvers<ContextType = any, ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type PrepareOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['PrepareOtpResponse'] = ResolversParentTypes['PrepareOtpResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['PrepareOtpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type PrepareOtpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['PrepareOtpResult'] = ResolversParentTypes['PrepareOtpResult']> = {
	otpUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	config?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['RoleDefinition']>, ParentType, ContextType>
	members?: Resolver<ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>, ParentType, ContextType, RequireFields<ProjectMembersArgs, never>>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ProjectIdentityRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectIdentityRelation'] = ResolversParentTypes['ProjectIdentityRelation']> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	me?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
	projectBySlug?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType, RequireFields<QueryProjectBySlugArgs, 'slug'>>
	projectMemberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType, RequireFields<QueryProjectMembershipsArgs, 'projectSlug' | 'identityId'>>
	checkResetPasswordToken?: Resolver<ResolversTypes['CheckResetPasswordTokenCode'], ParentType, ContextType, RequireFields<QueryCheckResetPasswordTokenArgs, 'requestId' | 'token'>>
	identityProviders?: Resolver<ReadonlyArray<ResolversTypes['IdentityProvider']>, ParentType, ContextType>
}

export type RemoveMailTemplateErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveMailTemplateError'] = ResolversParentTypes['RemoveMailTemplateError']> = {
	code?: Resolver<ResolversTypes['RemoveMailTemplateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveMailTemplateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveMailTemplateResponse'] = ResolversParentTypes['RemoveMailTemplateResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveProjectMemberError'] = ResolversParentTypes['RemoveProjectMemberError']> = {
	code?: Resolver<ResolversTypes['RemoveProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveProjectMemberResponse'] = ResolversParentTypes['RemoveProjectMemberResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ResetPasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResetPasswordError'] = ResolversParentTypes['ResetPasswordError']> = {
	code?: Resolver<ResolversTypes['ResetPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ResetPasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResetPasswordResponse'] = ResolversParentTypes['ResetPasswordResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleDefinition'] = ResolversParentTypes['RoleDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['RoleVariableDefinition']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleEntityVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleEntityVariableDefinition'] = ResolversParentTypes['RoleEntityVariableDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RolePredefinedVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RolePredefinedVariableDefinition'] = ResolversParentTypes['RolePredefinedVariableDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	value?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleVariableDefinition'] = ResolversParentTypes['RoleVariableDefinition']> = {
	__resolveType: TypeResolveFn<'RoleEntityVariableDefinition' | 'RolePredefinedVariableDefinition', ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type SetProjectSecretResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SetProjectSecretResponse'] = ResolversParentTypes['SetProjectSecretResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInError'] = ResolversParentTypes['SignInError']> = {
	code?: Resolver<ResolversTypes['SignInErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInIDPError'] = ResolversParentTypes['SignInIDPError']> = {
	code?: Resolver<ResolversTypes['SignInIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInIDPResponse'] = ResolversParentTypes['SignInIDPResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInIDPResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInIdpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInIDPResult'] = ResolversParentTypes['SignInIDPResult']> = {
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['SignInError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']> = {
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignOutErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignOutError'] = ResolversParentTypes['SignOutError']> = {
	code?: Resolver<ResolversTypes['SignOutErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignOutResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignOutResponse'] = ResolversParentTypes['SignOutResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignOutError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['SignOutError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpError'] = ResolversParentTypes['SignUpError']> = {
	code?: Resolver<ResolversTypes['SignUpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignUpError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['SignUpError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignUpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpResult'] = ResolversParentTypes['SignUpResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateIDPError'] = ResolversParentTypes['UpdateIDPError']> = {
	code?: Resolver<ResolversTypes['UpdateIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateIDPResponse'] = ResolversParentTypes['UpdateIDPResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectMemberError'] = ResolversParentTypes['UpdateProjectMemberError']> = {
	code?: Resolver<ResolversTypes['UpdateProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectMemberResponse'] = ResolversParentTypes['UpdateProjectMemberResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	error?: Resolver<Maybe<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectResponse'] = ResolversParentTypes['UpdateProjectResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type VariableEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['VariableEntry'] = ResolversParentTypes['VariableEntry']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	values?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	AddIDPError?: AddIdpErrorResolvers<ContextType>
	AddIDPResponse?: AddIdpResponseResolvers<ContextType>
	AddMailTemplateError?: AddMailTemplateErrorResolvers<ContextType>
	AddMailTemplateResponse?: AddMailTemplateResponseResolvers<ContextType>
	AddProjectMemberError?: AddProjectMemberErrorResolvers<ContextType>
	AddProjectMemberResponse?: AddProjectMemberResponseResolvers<ContextType>
	ApiKey?: ApiKeyResolvers<ContextType>
	ApiKeyWithToken?: ApiKeyWithTokenResolvers<ContextType>
	ChangeMyPasswordError?: ChangeMyPasswordErrorResolvers<ContextType>
	ChangeMyPasswordResponse?: ChangeMyPasswordResponseResolvers<ContextType>
	ChangePasswordError?: ChangePasswordErrorResolvers<ContextType>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<ContextType>
	CheckResetPasswordTokenResult?: CheckResetPasswordTokenResultResolvers<ContextType>
	CommonSignInResult?: CommonSignInResultResolvers<ContextType>
	ConfirmOtpError?: ConfirmOtpErrorResolvers<ContextType>
	ConfirmOtpResponse?: ConfirmOtpResponseResolvers<ContextType>
	CreateApiKeyError?: CreateApiKeyErrorResolvers<ContextType>
	CreateApiKeyResponse?: CreateApiKeyResponseResolvers<ContextType>
	CreateApiKeyResult?: CreateApiKeyResultResolvers<ContextType>
	CreatePasswordResetRequestError?: CreatePasswordResetRequestErrorResolvers<ContextType>
	CreatePasswordResetRequestResponse?: CreatePasswordResetRequestResponseResolvers<ContextType>
	CreateProjectResponse?: CreateProjectResponseResolvers<ContextType>
	CreateProjectResponseError?: CreateProjectResponseErrorResolvers<ContextType>
	CreateProjectResult?: CreateProjectResultResolvers<ContextType>
	CreateSessionTokenError?: CreateSessionTokenErrorResolvers<ContextType>
	CreateSessionTokenResponse?: CreateSessionTokenResponseResolvers<ContextType>
	CreateSessionTokenResult?: CreateSessionTokenResultResolvers<ContextType>
	DateTime?: GraphQLScalarType
	DisableApiKeyError?: DisableApiKeyErrorResolvers<ContextType>
	DisableApiKeyResponse?: DisableApiKeyResponseResolvers<ContextType>
	DisableIDPError?: DisableIdpErrorResolvers<ContextType>
	DisableIDPResponse?: DisableIdpResponseResolvers<ContextType>
	DisableOtpError?: DisableOtpErrorResolvers<ContextType>
	DisableOtpResponse?: DisableOtpResponseResolvers<ContextType>
	EnableIDPError?: EnableIdpErrorResolvers<ContextType>
	EnableIDPResponse?: EnableIdpResponseResolvers<ContextType>
	Identity?: IdentityResolvers<ContextType>
	IdentityGlobalPermissions?: IdentityGlobalPermissionsResolvers<ContextType>
	IdentityProjectRelation?: IdentityProjectRelationResolvers<ContextType>
	IdentityProvider?: IdentityProviderResolvers<ContextType>
	InitSignInIDPError?: InitSignInIdpErrorResolvers<ContextType>
	InitSignInIDPResponse?: InitSignInIdpResponseResolvers<ContextType>
	InitSignInIDPResult?: InitSignInIdpResultResolvers<ContextType>
	InviteError?: InviteErrorResolvers<ContextType>
	InviteResponse?: InviteResponseResolvers<ContextType>
	InviteResult?: InviteResultResolvers<ContextType>
	Json?: GraphQLScalarType
	Membership?: MembershipResolvers<ContextType>
	MembershipValidationError?: MembershipValidationErrorResolvers<ContextType>
	Mutation?: MutationResolvers<ContextType>
	Person?: PersonResolvers<ContextType>
	PrepareOtpResponse?: PrepareOtpResponseResolvers<ContextType>
	PrepareOtpResult?: PrepareOtpResultResolvers<ContextType>
	Project?: ProjectResolvers<ContextType>
	ProjectIdentityRelation?: ProjectIdentityRelationResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RemoveMailTemplateError?: RemoveMailTemplateErrorResolvers<ContextType>
	RemoveMailTemplateResponse?: RemoveMailTemplateResponseResolvers<ContextType>
	RemoveProjectMemberError?: RemoveProjectMemberErrorResolvers<ContextType>
	RemoveProjectMemberResponse?: RemoveProjectMemberResponseResolvers<ContextType>
	ResetPasswordError?: ResetPasswordErrorResolvers<ContextType>
	ResetPasswordResponse?: ResetPasswordResponseResolvers<ContextType>
	RoleDefinition?: RoleDefinitionResolvers<ContextType>
	RoleEntityVariableDefinition?: RoleEntityVariableDefinitionResolvers<ContextType>
	RolePredefinedVariableDefinition?: RolePredefinedVariableDefinitionResolvers<ContextType>
	RoleVariableDefinition?: RoleVariableDefinitionResolvers<ContextType>
	SetProjectSecretResponse?: SetProjectSecretResponseResolvers<ContextType>
	SignInError?: SignInErrorResolvers<ContextType>
	SignInIDPError?: SignInIdpErrorResolvers<ContextType>
	SignInIDPResponse?: SignInIdpResponseResolvers<ContextType>
	SignInIDPResult?: SignInIdpResultResolvers<ContextType>
	SignInResponse?: SignInResponseResolvers<ContextType>
	SignInResult?: SignInResultResolvers<ContextType>
	SignOutError?: SignOutErrorResolvers<ContextType>
	SignOutResponse?: SignOutResponseResolvers<ContextType>
	SignUpError?: SignUpErrorResolvers<ContextType>
	SignUpResponse?: SignUpResponseResolvers<ContextType>
	SignUpResult?: SignUpResultResolvers<ContextType>
	UpdateIDPError?: UpdateIdpErrorResolvers<ContextType>
	UpdateIDPResponse?: UpdateIdpResponseResolvers<ContextType>
	UpdateProjectMemberError?: UpdateProjectMemberErrorResolvers<ContextType>
	UpdateProjectMemberResponse?: UpdateProjectMemberResponseResolvers<ContextType>
	UpdateProjectResponse?: UpdateProjectResponseResolvers<ContextType>
	VariableEntry?: VariableEntryResolvers<ContextType>
}


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>

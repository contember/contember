import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never }
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string }
	String: { input: string; output: string }
	Boolean: { input: boolean; output: boolean }
	Int: { input: number; output: number }
	Float: { input: number; output: number }
	DateTime: { input: any; output: any }
	Json: { input: any; output: any }
}

export type ActivatePasswordlessOtpError = {
	readonly __typename?: 'ActivatePasswordlessOtpError'
	readonly code: ActivatePasswordlessOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ActivatePasswordlessOtpErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_USED'

export type ActivatePasswordlessOtpResponse = {
	readonly __typename?: 'ActivatePasswordlessOtpResponse'
	readonly error?: Maybe<ActivatePasswordlessOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddGlobalIdentityRolesError = {
	readonly __typename?: 'AddGlobalIdentityRolesError'
	readonly code: AddGlobalIdentityRolesErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type AddGlobalIdentityRolesErrorCode =
  | 'IDENTITY_NOT_FOUND'
  | 'INVALID_ROLE'

export type AddGlobalIdentityRolesResponse = {
	readonly __typename?: 'AddGlobalIdentityRolesResponse'
	readonly error?: Maybe<AddGlobalIdentityRolesError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<AddGlobalIdentityRolesResult>
}

export type AddGlobalIdentityRolesResult = {
	readonly __typename?: 'AddGlobalIdentityRolesResult'
	readonly identity: Identity
}

export type AddIdpError = {
	readonly __typename?: 'AddIDPError'
	readonly code: AddIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type AddIdpErrorCode =
  | 'ALREADY_EXISTS'
  | 'INVALID_CONFIGURATION'
  | 'UNKNOWN_TYPE'

export type AddIdpResponse = {
	readonly __typename?: 'AddIDPResponse'
	readonly error?: Maybe<AddIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddMailTemplateError = {
	readonly __typename?: 'AddMailTemplateError'
	readonly code: AddMailTemplateErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type AddMailTemplateErrorCode =
  | 'INVALID_REPLY_EMAIL_FORMAT'
  | 'MISSING_VARIABLE'
  | 'PROJECT_NOT_FOUND'

export type AddMailTemplateResponse = {
	readonly __typename?: 'AddMailTemplateResponse'
	readonly error?: Maybe<AddMailTemplateError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<AddMailTemplateError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddProjectMemberError = {
	readonly __typename?: 'AddProjectMemberError'
	readonly code: AddProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type AddProjectMemberErrorCode =
  | 'ALREADY_MEMBER'
  | 'IDENTITY_NOT_FOUND'
  | 'INVALID_MEMBERSHIP'
  | 'PROJECT_NOT_FOUND'
  | 'ROLE_NOT_FOUND'
  | 'VARIABLE_EMPTY'
  | 'VARIABLE_NOT_FOUND'

export type AddProjectMemberResponse = {
	readonly __typename?: 'AddProjectMemberResponse'
	readonly error?: Maybe<AddProjectMemberError>
	readonly errors: ReadonlyArray<AddProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type ApiKey = {
	readonly __typename?: 'ApiKey'
	readonly id: Scalars['String']['output']
	readonly identity: Identity
}

export type ApiKeyWithToken = {
	readonly __typename?: 'ApiKeyWithToken'
	readonly id: Scalars['String']['output']
	readonly identity: Identity
	readonly token?: Maybe<Scalars['String']['output']>
}

export type ChangeMyPasswordError = {
	readonly __typename?: 'ChangeMyPasswordError'
	readonly code: ChangeMyPasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ChangeMyPasswordErrorCode =
  | 'INVALID_PASSWORD'
  | 'NOT_A_PERSON'
  | 'NO_PASSWORD_SET'
  | 'TOO_WEAK'

export type ChangeMyPasswordResponse = {
	readonly __typename?: 'ChangeMyPasswordResponse'
	readonly error?: Maybe<ChangeMyPasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangeMyProfileError = {
	readonly __typename?: 'ChangeMyProfileError'
	readonly code: ChangeMyProfileErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ChangeMyProfileErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL_FORMAT'
  | 'NOT_A_PERSON'

export type ChangeMyProfileResponse = {
	readonly __typename?: 'ChangeMyProfileResponse'
	readonly error?: Maybe<ChangeMyProfileError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangePasswordError = {
	readonly __typename?: 'ChangePasswordError'
	readonly code: ChangePasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type ChangePasswordErrorCode =
  | 'PERSON_NOT_FOUND'
  | 'TOO_WEAK'

export type ChangePasswordResponse = {
	readonly __typename?: 'ChangePasswordResponse'
	readonly error?: Maybe<ChangePasswordError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ChangePasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangeProfileError = {
	readonly __typename?: 'ChangeProfileError'
	readonly code: ChangeProfileErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ChangeProfileErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL_FORMAT'
  | 'PERSON_NOT_FOUND'

export type ChangeProfileResponse = {
	readonly __typename?: 'ChangeProfileResponse'
	readonly error?: Maybe<ChangeProfileError>
	readonly ok: Scalars['Boolean']['output']
}

export type CheckResetPasswordTokenCode =
  | 'REQUEST_NOT_FOUND'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_USED'

export type CheckResetPasswordTokenResult = {
	readonly __typename?: 'CheckResetPasswordTokenResult'
	readonly code: CheckResetPasswordTokenCode
}

export type CommonSignInResult = {
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type Config = {
	readonly __typename?: 'Config'
	readonly passwordless: ConfigPasswordless
}

export type ConfigInput = {
	readonly passwordless?: InputMaybe<ConfigPasswordlessInput>
}

export type ConfigPasswordless = {
	readonly __typename?: 'ConfigPasswordless'
	readonly enabled: ConfigPolicy
	readonly expirationMinutes: Scalars['Int']['output']
	readonly url?: Maybe<Scalars['String']['output']>
}

export type ConfigPasswordlessInput = {
	readonly enabled?: InputMaybe<ConfigPolicy>
	readonly expirationMinutes?: InputMaybe<Scalars['Int']['input']>
	readonly url?: InputMaybe<Scalars['String']['input']>
}

export type ConfigPolicy =
  | 'always'
  | 'never'
  | 'optIn'
  | 'optOut'

export type ConfigureError = {
	readonly __typename?: 'ConfigureError'
	readonly code: ConfigureErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ConfigureErrorCode =
  | 'INVALID_CONFIG'

export type ConfigureResponse = {
	readonly __typename?: 'ConfigureResponse'
	readonly error?: Maybe<ConfigureError>
	readonly ok: Scalars['Boolean']['output']
}

export type ConfirmOtpError = {
	readonly __typename?: 'ConfirmOtpError'
	readonly code: ConfirmOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type ConfirmOtpErrorCode =
  | 'INVALID_OTP_TOKEN'
  | 'NOT_PREPARED'

export type ConfirmOtpResponse = {
	readonly __typename?: 'ConfirmOtpResponse'
	readonly error?: Maybe<ConfirmOtpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ConfirmOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type CreateApiKeyError = {
	readonly __typename?: 'CreateApiKeyError'
	readonly code: CreateApiKeyErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type CreateApiKeyErrorCode =
  | 'INVALID_MEMBERSHIP'
  | 'PROJECT_NOT_FOUND'
  | 'ROLE_NOT_FOUND'
  | 'VARIABLE_EMPTY'
  | 'VARIABLE_NOT_FOUND'

export type CreateApiKeyResponse = {
	readonly __typename?: 'CreateApiKeyResponse'
	readonly error?: Maybe<CreateApiKeyError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	readonly __typename?: 'CreateApiKeyResult'
	readonly apiKey: ApiKeyWithToken
}

export type CreatePasswordResetRequestError = {
	readonly __typename?: 'CreatePasswordResetRequestError'
	readonly code: CreatePasswordResetRequestErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type CreatePasswordResetRequestErrorCode =
  | 'PERSON_NOT_FOUND'

export type CreatePasswordResetRequestResponse = {
	readonly __typename?: 'CreatePasswordResetRequestResponse'
	readonly error?: Maybe<CreatePasswordResetRequestError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreatePasswordResetRequestError>
	readonly ok: Scalars['Boolean']['output']
}

export type CreateProjectOptions = {
	readonly deployTokenHash?: InputMaybe<Scalars['String']['input']>
	readonly noDeployToken?: InputMaybe<Scalars['Boolean']['input']>
}

export type CreateProjectResponse = {
	readonly __typename?: 'CreateProjectResponse'
	readonly error?: Maybe<CreateProjectResponseError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateProjectResult>
}

export type CreateProjectResponseError = {
	readonly __typename?: 'CreateProjectResponseError'
	readonly code: CreateProjectResponseErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateProjectResponseErrorCode =
  | 'ALREADY_EXISTS'
  | 'INIT_ERROR'

export type CreateProjectResult = {
	readonly __typename?: 'CreateProjectResult'
	readonly deployerApiKey?: Maybe<ApiKeyWithToken>
}

export type CreateResetPasswordRequestOptions = {
	readonly mailProject?: InputMaybe<Scalars['String']['input']>
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
}

export type CreateSessionTokenError = {
	readonly __typename?: 'CreateSessionTokenError'
	readonly code: CreateSessionTokenErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateSessionTokenErrorCode =
  | 'PERSON_DISABLED'
  | 'UNKNOWN_EMAIL'
  | 'UNKNOWN_PERSON_ID'

export type CreateSessionTokenResponse = {
	readonly __typename?: 'CreateSessionTokenResponse'
	readonly error?: Maybe<CreateSessionTokenError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateSessionTokenResult>
}

export type CreateSessionTokenResult = CommonSignInResult & {
	readonly __typename?: 'CreateSessionTokenResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type DisableApiKeyError = {
	readonly __typename?: 'DisableApiKeyError'
	readonly code: DisableApiKeyErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type DisableApiKeyErrorCode =
  | 'KEY_NOT_FOUND'

export type DisableApiKeyResponse = {
	readonly __typename?: 'DisableApiKeyResponse'
	readonly error?: Maybe<DisableApiKeyError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableApiKeyError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableIdpError = {
	readonly __typename?: 'DisableIDPError'
	readonly code: DisableIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisableIdpErrorCode =
  | 'NOT_FOUND'

export type DisableIdpResponse = {
	readonly __typename?: 'DisableIDPResponse'
	readonly error?: Maybe<DisableIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableOtpError = {
	readonly __typename?: 'DisableOtpError'
	readonly code: DisableOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type DisableOtpErrorCode =
  | 'OTP_NOT_ACTIVE'

export type DisableOtpResponse = {
	readonly __typename?: 'DisableOtpResponse'
	readonly error?: Maybe<DisableOtpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisablePersonError = {
	readonly __typename?: 'DisablePersonError'
	readonly code: DisablePersonErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisablePersonErrorCode =
  | 'PERSON_ALREADY_DISABLED'
  | 'PERSON_NOT_FOUND'

export type DisablePersonResponse = {
	readonly __typename?: 'DisablePersonResponse'
	readonly error?: Maybe<DisablePersonError>
	readonly ok: Scalars['Boolean']['output']
}

export type EnableIdpError = {
	readonly __typename?: 'EnableIDPError'
	readonly code: EnableIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type EnableIdpErrorCode =
  | 'NOT_FOUND'

export type EnableIdpResponse = {
	readonly __typename?: 'EnableIDPResponse'
	readonly error?: Maybe<EnableIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type IdpOptions = {
	readonly autoSignUp?: InputMaybe<Scalars['Boolean']['input']>
	readonly exclusive?: InputMaybe<Scalars['Boolean']['input']>
	readonly initReturnsConfig?: InputMaybe<Scalars['Boolean']['input']>
}

export type IdpOptionsOutput = {
	readonly __typename?: 'IDPOptionsOutput'
	readonly autoSignUp: Scalars['Boolean']['output']
	readonly exclusive: Scalars['Boolean']['output']
	readonly initReturnsConfig: Scalars['Boolean']['output']
}

export type IdpResponseInput = {
	readonly url: Scalars['String']['input']
}

export type Identity = {
	readonly __typename?: 'Identity'
	readonly apiKey?: Maybe<ApiKey>
	readonly description?: Maybe<Scalars['String']['output']>
	readonly id: Scalars['String']['output']
	readonly permissions?: Maybe<IdentityGlobalPermissions>
	readonly person?: Maybe<Person>
	readonly projects: ReadonlyArray<IdentityProjectRelation>
	readonly roles?: Maybe<ReadonlyArray<Scalars['String']['output']>>
}

export type IdentityGlobalPermissions = {
	readonly __typename?: 'IdentityGlobalPermissions'
	readonly canCreateProject: Scalars['Boolean']['output']
	readonly canDeployEntrypoint: Scalars['Boolean']['output']
}

export type IdentityProjectRelation = {
	readonly __typename?: 'IdentityProjectRelation'
	readonly memberships: ReadonlyArray<Membership>
	readonly project: Project
}

export type IdentityProvider = {
	readonly __typename?: 'IdentityProvider'
	readonly configuration: Scalars['Json']['output']
	readonly disabledAt?: Maybe<Scalars['DateTime']['output']>
	readonly options: IdpOptionsOutput
	readonly slug: Scalars['String']['output']
	readonly type: Scalars['String']['output']
}

export type InitSignInIdpError = {
	readonly __typename?: 'InitSignInIDPError'
	readonly code: InitSignInIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type InitSignInIdpErrorCode =
  | 'IDP_VALIDATION_FAILED'
  | 'PROVIDER_NOT_FOUND'

export type InitSignInIdpResponse = {
	readonly __typename?: 'InitSignInIDPResponse'
	readonly error?: Maybe<InitSignInIdpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InitSignInIdpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InitSignInIdpResult>
}

export type InitSignInIdpResult = {
	readonly __typename?: 'InitSignInIDPResult'
	readonly authUrl: Scalars['String']['output']
	readonly idpConfiguration?: Maybe<Scalars['Json']['output']>
	readonly sessionData: Scalars['Json']['output']
}

export type InitSignInPasswordlessError = {
	readonly __typename?: 'InitSignInPasswordlessError'
	readonly code: InitSignInPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type InitSignInPasswordlessErrorCode =
  | 'PASSWORDLESS_DISABLED'
  | 'PERSON_NOT_FOUND'

export type InitSignInPasswordlessOptions = {
	readonly mailProject?: InputMaybe<Scalars['String']['input']>
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
}

export type InitSignInPasswordlessResponse = {
	readonly __typename?: 'InitSignInPasswordlessResponse'
	readonly error?: Maybe<InitSignInPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InitSignInPasswordlessResult>
}

export type InitSignInPasswordlessResult = {
	readonly __typename?: 'InitSignInPasswordlessResult'
	readonly expiresAt: Scalars['DateTime']['output']
	readonly requestId: Scalars['String']['output']
}

export type InviteError = {
	readonly __typename?: 'InviteError'
	readonly code: InviteErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type InviteErrorCode =
  | 'ALREADY_MEMBER'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_MEMBERSHIP'
  | 'PROJECT_NOT_FOUND'
  | 'ROLE_NOT_FOUND'
  | 'VARIABLE_EMPTY'
  | 'VARIABLE_NOT_FOUND'

export type InviteMethod =
  | 'CREATE_PASSWORD'
  | 'RESET_PASSWORD'

export type InviteOptions = {
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
	readonly method?: InputMaybe<InviteMethod>
}

export type InviteResponse = {
	readonly __typename?: 'InviteResponse'
	readonly error?: Maybe<InviteError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InviteError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InviteResult>
}

export type InviteResult = {
	readonly __typename?: 'InviteResult'
	readonly isNew: Scalars['Boolean']['output']
	readonly person: Person
}

export type MailTemplate = {
	readonly content: Scalars['String']['input']
	readonly projectSlug?: InputMaybe<Scalars['String']['input']>
	readonly replyTo?: InputMaybe<Scalars['String']['input']>
	readonly subject: Scalars['String']['input']
	readonly type: MailType
	readonly useLayout?: InputMaybe<Scalars['Boolean']['input']>
	/** Custom mail variant identifier, e.g. a locale. */
	readonly variant?: InputMaybe<Scalars['String']['input']>
}

export type MailTemplateData = {
	readonly __typename?: 'MailTemplateData'
	readonly content: Scalars['String']['output']
	readonly projectSlug?: Maybe<Scalars['String']['output']>
	readonly replyTo?: Maybe<Scalars['String']['output']>
	readonly subject: Scalars['String']['output']
	readonly type: MailType
	readonly useLayout: Scalars['Boolean']['output']
	readonly variant?: Maybe<Scalars['String']['output']>
}

export type MailTemplateIdentifier = {
	readonly projectSlug?: InputMaybe<Scalars['String']['input']>
	readonly type: MailType
	readonly variant?: InputMaybe<Scalars['String']['input']>
}

export type MailType =
  | 'EXISTING_USER_INVITED'
  | 'NEW_USER_INVITED'
  | 'PASSWORDLESS_SIGN_IN'
  | 'RESET_PASSWORD_REQUEST'

export type MemberType =
  | 'API_KEY'
  | 'PERSON'

export type Membership = {
	readonly __typename?: 'Membership'
	readonly role: Scalars['String']['output']
	readonly variables: ReadonlyArray<VariableEntry>
}

export type MembershipInput = {
	readonly role: Scalars['String']['input']
	readonly variables: ReadonlyArray<VariableEntryInput>
}

export type MembershipValidationError = {
	readonly __typename?: 'MembershipValidationError'
	readonly code: MembershipValidationErrorCode
	readonly role: Scalars['String']['output']
	readonly variable?: Maybe<Scalars['String']['output']>
}

export type MembershipValidationErrorCode =
  | 'ROLE_NOT_FOUND'
  | 'VARIABLE_EMPTY'
  | 'VARIABLE_INVALID'
  | 'VARIABLE_NOT_FOUND'

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly activatePasswordlessOtp?: Maybe<ActivatePasswordlessOtpResponse>
	readonly addGlobalIdentityRoles?: Maybe<AddGlobalIdentityRolesResponse>
	readonly addIDP?: Maybe<AddIdpResponse>
	readonly addMailTemplate?: Maybe<AddMailTemplateResponse>
	/** @deprecated use addMailTemplate */
	readonly addProjectMailTemplate?: Maybe<AddMailTemplateResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly changeMyPassword?: Maybe<ChangeMyPasswordResponse>
	readonly changeMyProfile?: Maybe<ChangeMyProfileResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly changeProfile?: Maybe<ChangeProfileResponse>
	readonly configure?: Maybe<ConfigureResponse>
	readonly confirmOtp?: Maybe<ConfirmOtpResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
	readonly createGlobalApiKey?: Maybe<CreateApiKeyResponse>
	readonly createProject?: Maybe<CreateProjectResponse>
	readonly createResetPasswordRequest?: Maybe<CreatePasswordResetRequestResponse>
	readonly createSessionToken?: Maybe<CreateSessionTokenResponse>
	readonly disableApiKey?: Maybe<DisableApiKeyResponse>
	readonly disableIDP?: Maybe<DisableIdpResponse>
	readonly disableMyPasswordless?: Maybe<ToggleMyPasswordlessResponse>
	readonly disableOtp?: Maybe<DisableOtpResponse>
	readonly disablePerson?: Maybe<DisablePersonResponse>
	readonly enableIDP?: Maybe<EnableIdpResponse>
	readonly enableMyPasswordless?: Maybe<ToggleMyPasswordlessResponse>
	readonly initSignInIDP?: Maybe<InitSignInIdpResponse>
	readonly initSignInPasswordless?: Maybe<InitSignInPasswordlessResponse>
	readonly invite?: Maybe<InviteResponse>
	readonly prepareOtp?: Maybe<PrepareOtpResponse>
	readonly removeGlobalIdentityRoles?: Maybe<RemoveGlobalIdentityRolesResponse>
	readonly removeMailTemplate?: Maybe<RemoveMailTemplateResponse>
	/** @deprecated use removeMailTemplate */
	readonly removeProjectMailTemplate?: Maybe<RemoveMailTemplateResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	readonly resetPassword?: Maybe<ResetPasswordResponse>
	readonly setProjectSecret?: Maybe<SetProjectSecretResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly signInIDP?: Maybe<SignInIdpResponse>
	readonly signInPasswordless?: Maybe<SignInPasswordlessResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly signUp?: Maybe<SignUpResponse>
	readonly unmanagedInvite?: Maybe<InviteResponse>
	readonly updateIDP?: Maybe<UpdateIdpResponse>
	readonly updateProject?: Maybe<UpdateProjectResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
}


export type MutationActivatePasswordlessOtpArgs = {
	otpHash: Scalars['String']['input']
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
}


export type MutationAddGlobalIdentityRolesArgs = {
	identityId: Scalars['String']['input']
	roles: ReadonlyArray<Scalars['String']['input']>
}


export type MutationAddIdpArgs = {
	configuration: Scalars['Json']['input']
	identityProvider: Scalars['String']['input']
	options?: InputMaybe<IdpOptions>
	type: Scalars['String']['input']
}


export type MutationAddMailTemplateArgs = {
	template: MailTemplate
}


export type MutationAddProjectMailTemplateArgs = {
	template: MailTemplate
}


export type MutationAddProjectMemberArgs = {
	identityId: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	projectSlug: Scalars['String']['input']
}


export type MutationChangeMyPasswordArgs = {
	currentPassword: Scalars['String']['input']
	newPassword: Scalars['String']['input']
}


export type MutationChangeMyProfileArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
}


export type MutationChangePasswordArgs = {
	password: Scalars['String']['input']
	personId: Scalars['String']['input']
}


export type MutationChangeProfileArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	personId: Scalars['String']['input']
}


export type MutationConfigureArgs = {
	config: ConfigInput
}


export type MutationConfirmOtpArgs = {
	otpToken: Scalars['String']['input']
}


export type MutationCreateApiKeyArgs = {
	description: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	projectSlug: Scalars['String']['input']
	tokenHash?: InputMaybe<Scalars['String']['input']>
}


export type MutationCreateGlobalApiKeyArgs = {
	description: Scalars['String']['input']
	roles?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	tokenHash?: InputMaybe<Scalars['String']['input']>
}


export type MutationCreateProjectArgs = {
	config?: InputMaybe<Scalars['Json']['input']>
	deployTokenHash?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<CreateProjectOptions>
	projectSlug: Scalars['String']['input']
	secrets?: InputMaybe<ReadonlyArray<ProjectSecret>>
}


export type MutationCreateResetPasswordRequestArgs = {
	email: Scalars['String']['input']
	options?: InputMaybe<CreateResetPasswordRequestOptions>
}


export type MutationCreateSessionTokenArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	expiration?: InputMaybe<Scalars['Int']['input']>
	personId?: InputMaybe<Scalars['String']['input']>
}


export type MutationDisableApiKeyArgs = {
	id: Scalars['String']['input']
}


export type MutationDisableIdpArgs = {
	identityProvider: Scalars['String']['input']
}


export type MutationDisablePersonArgs = {
	personId: Scalars['String']['input']
}


export type MutationEnableIdpArgs = {
	identityProvider: Scalars['String']['input']
}


export type MutationInitSignInIdpArgs = {
	data?: InputMaybe<Scalars['Json']['input']>
	identityProvider: Scalars['String']['input']
	redirectUrl?: InputMaybe<Scalars['String']['input']>
}


export type MutationInitSignInPasswordlessArgs = {
	email: Scalars['String']['input']
	options?: InputMaybe<InitSignInPasswordlessOptions>
}


export type MutationInviteArgs = {
	email: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<InviteOptions>
	projectSlug: Scalars['String']['input']
}


export type MutationPrepareOtpArgs = {
	label?: InputMaybe<Scalars['String']['input']>
}


export type MutationRemoveGlobalIdentityRolesArgs = {
	identityId: Scalars['String']['input']
	roles: ReadonlyArray<Scalars['String']['input']>
}


export type MutationRemoveMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}


export type MutationRemoveProjectMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}


export type MutationRemoveProjectMemberArgs = {
	identityId: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
}


export type MutationResetPasswordArgs = {
	password: Scalars['String']['input']
	token: Scalars['String']['input']
}


export type MutationSetProjectSecretArgs = {
	key: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
	value: Scalars['String']['input']
}


export type MutationSignInArgs = {
	email: Scalars['String']['input']
	expiration?: InputMaybe<Scalars['Int']['input']>
	otpToken?: InputMaybe<Scalars['String']['input']>
	password: Scalars['String']['input']
}


export type MutationSignInIdpArgs = {
	data?: InputMaybe<Scalars['Json']['input']>
	expiration?: InputMaybe<Scalars['Int']['input']>
	identityProvider: Scalars['String']['input']
	idpResponse?: InputMaybe<IdpResponseInput>
	redirectUrl?: InputMaybe<Scalars['String']['input']>
	sessionData?: InputMaybe<Scalars['Json']['input']>
}


export type MutationSignInPasswordlessArgs = {
	expiration?: InputMaybe<Scalars['Int']['input']>
	mfaOtp?: InputMaybe<Scalars['String']['input']>
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
	validationType: PasswordlessValidationType
}


export type MutationSignOutArgs = {
	all?: InputMaybe<Scalars['Boolean']['input']>
}


export type MutationSignUpArgs = {
	email: Scalars['String']['input']
	name?: InputMaybe<Scalars['String']['input']>
	password?: InputMaybe<Scalars['String']['input']>
	passwordHash?: InputMaybe<Scalars['String']['input']>
	roles?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
}


export type MutationUnmanagedInviteArgs = {
	email: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<UnmanagedInviteOptions>
	password?: InputMaybe<Scalars['String']['input']>
	projectSlug: Scalars['String']['input']
}


export type MutationUpdateIdpArgs = {
	configuration?: InputMaybe<Scalars['Json']['input']>
	identityProvider: Scalars['String']['input']
	mergeConfiguration?: InputMaybe<Scalars['Boolean']['input']>
	options?: InputMaybe<IdpOptions>
	type?: InputMaybe<Scalars['String']['input']>
}


export type MutationUpdateProjectArgs = {
	config?: InputMaybe<Scalars['Json']['input']>
	mergeConfig?: InputMaybe<Scalars['Boolean']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	projectSlug: Scalars['String']['input']
}


export type MutationUpdateProjectMemberArgs = {
	identityId: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	projectSlug: Scalars['String']['input']
}

export type PasswordlessValidationType =
  | 'otp'
  | 'token'

export type Person = {
	readonly __typename?: 'Person'
	readonly email?: Maybe<Scalars['String']['output']>
	readonly id: Scalars['String']['output']
	readonly identity: Identity
	readonly name?: Maybe<Scalars['String']['output']>
	readonly otpEnabled: Scalars['Boolean']['output']
	readonly passwordlessEnabled?: Maybe<Scalars['Boolean']['output']>
}

export type PrepareOtpResponse = {
	readonly __typename?: 'PrepareOtpResponse'
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<PrepareOtpResult>
}

export type PrepareOtpResult = {
	readonly __typename?: 'PrepareOtpResult'
	readonly otpSecret: Scalars['String']['output']
	readonly otpUri: Scalars['String']['output']
}

export type Project = {
	readonly __typename?: 'Project'
	readonly config: Scalars['Json']['output']
	readonly id: Scalars['String']['output']
	readonly members: ReadonlyArray<ProjectIdentityRelation>
	readonly name: Scalars['String']['output']
	readonly roles: ReadonlyArray<RoleDefinition>
	readonly slug: Scalars['String']['output']
}


export type ProjectMembersArgs = {
	input?: InputMaybe<ProjectMembersInput>
	memberType?: InputMaybe<MemberType>
}

export type ProjectIdentityRelation = {
	readonly __typename?: 'ProjectIdentityRelation'
	readonly identity: Identity
	readonly memberships: ReadonlyArray<Membership>
}

export type ProjectMembersFilter = {
	readonly email?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly identityId?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly memberType?: InputMaybe<MemberType>
	readonly personId?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
}

export type ProjectMembersInput = {
	readonly filter?: InputMaybe<ProjectMembersFilter>
	readonly limit?: InputMaybe<Scalars['Int']['input']>
	readonly offset?: InputMaybe<Scalars['Int']['input']>
}

export type ProjectSecret = {
	readonly key: Scalars['String']['input']
	readonly value: Scalars['String']['input']
}

export type Query = {
	readonly __typename?: 'Query'
	readonly checkResetPasswordToken: CheckResetPasswordTokenCode
	readonly configuration: Config
	readonly identityProviders: ReadonlyArray<IdentityProvider>
	readonly mailTemplates: ReadonlyArray<MailTemplateData>
	readonly me: Identity
	readonly personById?: Maybe<Person>
	readonly projectBySlug?: Maybe<Project>
	readonly projectMemberships: ReadonlyArray<Membership>
	readonly projects: ReadonlyArray<Project>
}


export type QueryCheckResetPasswordTokenArgs = {
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
}


export type QueryPersonByIdArgs = {
	id: Scalars['String']['input']
}


export type QueryProjectBySlugArgs = {
	slug: Scalars['String']['input']
}


export type QueryProjectMembershipsArgs = {
	identityId: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
}

export type RemoveGlobalIdentityRolesError = {
	readonly __typename?: 'RemoveGlobalIdentityRolesError'
	readonly code: RemoveGlobalIdentityRolesErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type RemoveGlobalIdentityRolesErrorCode =
  | 'IDENTITY_NOT_FOUND'
  | 'INVALID_ROLE'

export type RemoveGlobalIdentityRolesResponse = {
	readonly __typename?: 'RemoveGlobalIdentityRolesResponse'
	readonly error?: Maybe<RemoveGlobalIdentityRolesError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<RemoveGlobalIdentityRolesResult>
}

export type RemoveGlobalIdentityRolesResult = {
	readonly __typename?: 'RemoveGlobalIdentityRolesResult'
	readonly identity: Identity
}

export type RemoveMailTemplateError = {
	readonly __typename?: 'RemoveMailTemplateError'
	readonly code: RemoveMailTemplateErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type RemoveMailTemplateErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'TEMPLATE_NOT_FOUND'

export type RemoveMailTemplateResponse = {
	readonly __typename?: 'RemoveMailTemplateResponse'
	readonly error?: Maybe<RemoveMailTemplateError>
	readonly errors: ReadonlyArray<RemoveMailTemplateError>
	readonly ok: Scalars['Boolean']['output']
}

export type RemoveProjectMemberError = {
	readonly __typename?: 'RemoveProjectMemberError'
	readonly code: RemoveProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type RemoveProjectMemberErrorCode =
  | 'NOT_MEMBER'
  | 'PROJECT_NOT_FOUND'

export type RemoveProjectMemberResponse = {
	readonly __typename?: 'RemoveProjectMemberResponse'
	readonly error?: Maybe<RemoveProjectMemberError>
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type ResetPasswordError = {
	readonly __typename?: 'ResetPasswordError'
	readonly code: ResetPasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type ResetPasswordErrorCode =
  | 'PASSWORD_TOO_WEAK'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_USED'

export type ResetPasswordResponse = {
	readonly __typename?: 'ResetPasswordResponse'
	readonly error?: Maybe<ResetPasswordError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ResetPasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type RoleConditionVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RoleConditionVariableDefinition'
	readonly name: Scalars['String']['output']
}

export type RoleDefinition = {
	readonly __typename?: 'RoleDefinition'
	readonly name: Scalars['String']['output']
	readonly variables: ReadonlyArray<RoleVariableDefinition>
}

export type RoleEntityVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RoleEntityVariableDefinition'
	readonly entityName: Scalars['String']['output']
	readonly name: Scalars['String']['output']
}

export type RolePredefinedVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RolePredefinedVariableDefinition'
	readonly name: Scalars['String']['output']
	readonly value: Scalars['String']['output']
}

export type RoleVariableDefinition = {
	readonly name: Scalars['String']['output']
}

export type SetProjectSecretError = {
	readonly __typename?: 'SetProjectSecretError'
	readonly code: SetProjectSecretErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type SetProjectSecretErrorCode =
  | 'PROJECT_NOT_FOUND'

export type SetProjectSecretResponse = {
	readonly __typename?: 'SetProjectSecretResponse'
	readonly error?: Maybe<SetProjectSecretError>
	readonly ok: Scalars['Boolean']['output']
}

export type SignInError = {
	readonly __typename?: 'SignInError'
	readonly code: SignInErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type SignInErrorCode =
  | 'INVALID_OTP_TOKEN'
  | 'INVALID_PASSWORD'
  | 'NO_PASSWORD_SET'
  | 'OTP_REQUIRED'
  | 'PERSON_DISABLED'
  | 'UNKNOWN_EMAIL'

export type SignInIdpError = {
	readonly __typename?: 'SignInIDPError'
	readonly code: SignInIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type SignInIdpErrorCode =
  | 'IDP_VALIDATION_FAILED'
  | 'INVALID_IDP_RESPONSE'
  | 'PERSON_ALREADY_EXISTS'
  | 'PERSON_DISABLED'
  | 'PERSON_NOT_FOUND'

export type SignInIdpResponse = {
	readonly __typename?: 'SignInIDPResponse'
	readonly error?: Maybe<SignInIdpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInIdpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInIdpResult>
}

export type SignInIdpResult = CommonSignInResult & {
	readonly __typename?: 'SignInIDPResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignInPasswordlessError = {
	readonly __typename?: 'SignInPasswordlessError'
	readonly code: SignInPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type SignInPasswordlessErrorCode =
  | 'INVALID_OTP_TOKEN'
  | 'OTP_REQUIRED'
  | 'PERSON_DISABLED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_USED'

export type SignInPasswordlessResponse = {
	readonly __typename?: 'SignInPasswordlessResponse'
	readonly error?: Maybe<SignInPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInPasswordlessResult>
}

export type SignInPasswordlessResult = CommonSignInResult & {
	readonly __typename?: 'SignInPasswordlessResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignInResponse = {
	readonly __typename?: 'SignInResponse'
	readonly error?: Maybe<SignInError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = CommonSignInResult & {
	readonly __typename?: 'SignInResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignOutError = {
	readonly __typename?: 'SignOutError'
	readonly code: SignOutErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type SignOutErrorCode =
  | 'NOT_A_PERSON'
  | 'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY'

export type SignOutResponse = {
	readonly __typename?: 'SignOutResponse'
	readonly error?: Maybe<SignOutError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignOutError>
	readonly ok: Scalars['Boolean']['output']
}

export type SignUpError = {
	readonly __typename?: 'SignUpError'
	readonly code: SignUpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endPersonMessage?: Maybe<Scalars['String']['output']>
}

export type SignUpErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL_FORMAT'
  | 'TOO_WEAK'

export type SignUpResponse = {
	readonly __typename?: 'SignUpResponse'
	readonly error?: Maybe<SignUpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignUpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	readonly __typename?: 'SignUpResult'
	readonly person: Person
}

export type ToggleMyPasswordlessError = {
	readonly __typename?: 'ToggleMyPasswordlessError'
	readonly code: ToggleMyPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ToggleMyPasswordlessErrorCode =
  | 'CANNOT_TOGGLE'
  | 'NOT_A_PERSON'

export type ToggleMyPasswordlessResponse = {
	readonly __typename?: 'ToggleMyPasswordlessResponse'
	readonly error?: Maybe<ToggleMyPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
}

export type UnmanagedInviteOptions = {
	readonly password?: InputMaybe<Scalars['String']['input']>
	readonly resetTokenHash?: InputMaybe<Scalars['String']['input']>
}

export type UpdateIdpError = {
	readonly __typename?: 'UpdateIDPError'
	readonly code: UpdateIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateIdpErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'NOT_FOUND'

export type UpdateIdpResponse = {
	readonly __typename?: 'UpdateIDPResponse'
	readonly error?: Maybe<UpdateIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateProjectError = {
	readonly __typename?: 'UpdateProjectError'
	readonly code: UpdateProjectErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateProjectErrorCode =
  | 'PROJECT_NOT_FOUND'

export type UpdateProjectMemberError = {
	readonly __typename?: 'UpdateProjectMemberError'
	readonly code: UpdateProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type UpdateProjectMemberErrorCode =
  | 'INVALID_MEMBERSHIP'
  | 'NOT_MEMBER'
  | 'PROJECT_NOT_FOUND'
  | 'ROLE_NOT_FOUND'
  | 'VARIABLE_EMPTY'
  | 'VARIABLE_NOT_FOUND'

export type UpdateProjectMemberResponse = {
	readonly __typename?: 'UpdateProjectMemberResponse'
	readonly error?: Maybe<UpdateProjectMemberError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateProjectResponse = {
	readonly __typename?: 'UpdateProjectResponse'
	readonly error?: Maybe<UpdateProjectError>
	readonly ok: Scalars['Boolean']['output']
}

export type VariableEntry = {
	readonly __typename?: 'VariableEntry'
	readonly name: Scalars['String']['output']
	readonly values: ReadonlyArray<Scalars['String']['output']>
}

export type VariableEntryInput = {
	readonly name: Scalars['String']['input']
	readonly values: ReadonlyArray<Scalars['String']['input']>
}



export type ResolverTypeWrapper<T> = Promise<T> | T


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>

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
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

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


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
	CommonSignInResult: (CreateSessionTokenResult) | (SignInIdpResult) | (SignInPasswordlessResult) | (SignInResult)
	RoleVariableDefinition: (RoleConditionVariableDefinition) | (RoleEntityVariableDefinition) | (RolePredefinedVariableDefinition)
}

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	ActivatePasswordlessOtpError: ResolverTypeWrapper<ActivatePasswordlessOtpError>
	ActivatePasswordlessOtpErrorCode: ActivatePasswordlessOtpErrorCode
	ActivatePasswordlessOtpResponse: ResolverTypeWrapper<ActivatePasswordlessOtpResponse>
	AddGlobalIdentityRolesError: ResolverTypeWrapper<AddGlobalIdentityRolesError>
	AddGlobalIdentityRolesErrorCode: AddGlobalIdentityRolesErrorCode
	AddGlobalIdentityRolesResponse: ResolverTypeWrapper<Omit<AddGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversTypes['AddGlobalIdentityRolesResult']> }>
	AddGlobalIdentityRolesResult: ResolverTypeWrapper<Omit<AddGlobalIdentityRolesResult, 'identity'> & { identity: ResolversTypes['Identity'] }>
	AddIDPError: ResolverTypeWrapper<AddIdpError>
	AddIDPErrorCode: AddIdpErrorCode
	AddIDPResponse: ResolverTypeWrapper<AddIdpResponse>
	AddMailTemplateError: ResolverTypeWrapper<AddMailTemplateError>
	AddMailTemplateErrorCode: AddMailTemplateErrorCode
	AddMailTemplateResponse: ResolverTypeWrapper<AddMailTemplateResponse>
	AddProjectMemberError: ResolverTypeWrapper<AddProjectMemberError>
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	AddProjectMemberResponse: ResolverTypeWrapper<AddProjectMemberResponse>
	ApiKey: ResolverTypeWrapper<Omit<ApiKey, 'identity'> & { identity: ResolversTypes['Identity'] }>
	ApiKeyWithToken: ResolverTypeWrapper<Omit<ApiKeyWithToken, 'identity'> & { identity: ResolversTypes['Identity'] }>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
	ChangeMyPasswordError: ResolverTypeWrapper<ChangeMyPasswordError>
	ChangeMyPasswordErrorCode: ChangeMyPasswordErrorCode
	ChangeMyPasswordResponse: ResolverTypeWrapper<ChangeMyPasswordResponse>
	ChangeMyProfileError: ResolverTypeWrapper<ChangeMyProfileError>
	ChangeMyProfileErrorCode: ChangeMyProfileErrorCode
	ChangeMyProfileResponse: ResolverTypeWrapper<ChangeMyProfileResponse>
	ChangePasswordError: ResolverTypeWrapper<ChangePasswordError>
	ChangePasswordErrorCode: ChangePasswordErrorCode
	ChangePasswordResponse: ResolverTypeWrapper<ChangePasswordResponse>
	ChangeProfileError: ResolverTypeWrapper<ChangeProfileError>
	ChangeProfileErrorCode: ChangeProfileErrorCode
	ChangeProfileResponse: ResolverTypeWrapper<ChangeProfileResponse>
	CheckResetPasswordTokenCode: CheckResetPasswordTokenCode
	CheckResetPasswordTokenResult: ResolverTypeWrapper<CheckResetPasswordTokenResult>
	CommonSignInResult: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['CommonSignInResult']>
	Config: ResolverTypeWrapper<Config>
	ConfigInput: ConfigInput
	ConfigPasswordless: ResolverTypeWrapper<ConfigPasswordless>
	ConfigPasswordlessInput: ConfigPasswordlessInput
	ConfigPolicy: ConfigPolicy
	ConfigureError: ResolverTypeWrapper<ConfigureError>
	ConfigureErrorCode: ConfigureErrorCode
	ConfigureResponse: ResolverTypeWrapper<ConfigureResponse>
	ConfirmOtpError: ResolverTypeWrapper<ConfirmOtpError>
	ConfirmOtpErrorCode: ConfirmOtpErrorCode
	ConfirmOtpResponse: ResolverTypeWrapper<ConfirmOtpResponse>
	CreateApiKeyError: ResolverTypeWrapper<CreateApiKeyError>
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResponse: ResolverTypeWrapper<Omit<CreateApiKeyResponse, 'result'> & { result?: Maybe<ResolversTypes['CreateApiKeyResult']> }>
	CreateApiKeyResult: ResolverTypeWrapper<Omit<CreateApiKeyResult, 'apiKey'> & { apiKey: ResolversTypes['ApiKeyWithToken'] }>
	CreatePasswordResetRequestError: ResolverTypeWrapper<CreatePasswordResetRequestError>
	CreatePasswordResetRequestErrorCode: CreatePasswordResetRequestErrorCode
	CreatePasswordResetRequestResponse: ResolverTypeWrapper<CreatePasswordResetRequestResponse>
	CreateProjectOptions: CreateProjectOptions
	CreateProjectResponse: ResolverTypeWrapper<Omit<CreateProjectResponse, 'result'> & { result?: Maybe<ResolversTypes['CreateProjectResult']> }>
	CreateProjectResponseError: ResolverTypeWrapper<CreateProjectResponseError>
	CreateProjectResponseErrorCode: CreateProjectResponseErrorCode
	CreateProjectResult: ResolverTypeWrapper<Omit<CreateProjectResult, 'deployerApiKey'> & { deployerApiKey?: Maybe<ResolversTypes['ApiKeyWithToken']> }>
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: ResolverTypeWrapper<CreateSessionTokenError>
	CreateSessionTokenErrorCode: CreateSessionTokenErrorCode
	CreateSessionTokenResponse: ResolverTypeWrapper<CreateSessionTokenResponse>
	CreateSessionTokenResult: ResolverTypeWrapper<CreateSessionTokenResult>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>
	DisableApiKeyError: ResolverTypeWrapper<DisableApiKeyError>
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	DisableApiKeyResponse: ResolverTypeWrapper<DisableApiKeyResponse>
	DisableIDPError: ResolverTypeWrapper<DisableIdpError>
	DisableIDPErrorCode: DisableIdpErrorCode
	DisableIDPResponse: ResolverTypeWrapper<DisableIdpResponse>
	DisableOtpError: ResolverTypeWrapper<DisableOtpError>
	DisableOtpErrorCode: DisableOtpErrorCode
	DisableOtpResponse: ResolverTypeWrapper<DisableOtpResponse>
	DisablePersonError: ResolverTypeWrapper<DisablePersonError>
	DisablePersonErrorCode: DisablePersonErrorCode
	DisablePersonResponse: ResolverTypeWrapper<DisablePersonResponse>
	EnableIDPError: ResolverTypeWrapper<EnableIdpError>
	EnableIDPErrorCode: EnableIdpErrorCode
	EnableIDPResponse: ResolverTypeWrapper<EnableIdpResponse>
	IDPOptions: IdpOptions
	IDPOptionsOutput: ResolverTypeWrapper<IdpOptionsOutput>
	IDPResponseInput: IdpResponseInput
	Identity: ResolverTypeWrapper<Omit<Identity, 'apiKey' | 'projects'> & { apiKey?: Maybe<ResolversTypes['ApiKey']>; projects: ReadonlyArray<ResolversTypes['IdentityProjectRelation']> }>
	IdentityGlobalPermissions: ResolverTypeWrapper<IdentityGlobalPermissions>
	IdentityProjectRelation: ResolverTypeWrapper<Omit<IdentityProjectRelation, 'project'> & { project: ResolversTypes['Project'] }>
	IdentityProvider: ResolverTypeWrapper<IdentityProvider>
	InitSignInIDPError: ResolverTypeWrapper<InitSignInIdpError>
	InitSignInIDPErrorCode: InitSignInIdpErrorCode
	InitSignInIDPResponse: ResolverTypeWrapper<InitSignInIdpResponse>
	InitSignInIDPResult: ResolverTypeWrapper<InitSignInIdpResult>
	InitSignInPasswordlessError: ResolverTypeWrapper<InitSignInPasswordlessError>
	InitSignInPasswordlessErrorCode: InitSignInPasswordlessErrorCode
	InitSignInPasswordlessOptions: InitSignInPasswordlessOptions
	InitSignInPasswordlessResponse: ResolverTypeWrapper<InitSignInPasswordlessResponse>
	InitSignInPasswordlessResult: ResolverTypeWrapper<InitSignInPasswordlessResult>
	Int: ResolverTypeWrapper<Scalars['Int']['output']>
	InviteError: ResolverTypeWrapper<InviteError>
	InviteErrorCode: InviteErrorCode
	InviteMethod: InviteMethod
	InviteOptions: InviteOptions
	InviteResponse: ResolverTypeWrapper<InviteResponse>
	InviteResult: ResolverTypeWrapper<InviteResult>
	Json: ResolverTypeWrapper<Scalars['Json']['output']>
	MailTemplate: MailTemplate
	MailTemplateData: ResolverTypeWrapper<MailTemplateData>
	MailTemplateIdentifier: MailTemplateIdentifier
	MailType: MailType
	MemberType: MemberType
	Membership: ResolverTypeWrapper<Membership>
	MembershipInput: MembershipInput
	MembershipValidationError: ResolverTypeWrapper<MembershipValidationError>
	MembershipValidationErrorCode: MembershipValidationErrorCode
	Mutation: ResolverTypeWrapper<{}>
	PasswordlessValidationType: PasswordlessValidationType
	Person: ResolverTypeWrapper<Omit<Person, 'identity'> & { identity: ResolversTypes['Identity'] }>
	PrepareOtpResponse: ResolverTypeWrapper<PrepareOtpResponse>
	PrepareOtpResult: ResolverTypeWrapper<PrepareOtpResult>
	Project: ResolverTypeWrapper<Omit<Project, 'members' | 'roles'> & { members: ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>; roles: ReadonlyArray<ResolversTypes['RoleDefinition']> }>
	ProjectIdentityRelation: ResolverTypeWrapper<Omit<ProjectIdentityRelation, 'identity'> & { identity: ResolversTypes['Identity'] }>
	ProjectMembersFilter: ProjectMembersFilter
	ProjectMembersInput: ProjectMembersInput
	ProjectSecret: ProjectSecret
	Query: ResolverTypeWrapper<{}>
	RemoveGlobalIdentityRolesError: ResolverTypeWrapper<RemoveGlobalIdentityRolesError>
	RemoveGlobalIdentityRolesErrorCode: RemoveGlobalIdentityRolesErrorCode
	RemoveGlobalIdentityRolesResponse: ResolverTypeWrapper<Omit<RemoveGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversTypes['RemoveGlobalIdentityRolesResult']> }>
	RemoveGlobalIdentityRolesResult: ResolverTypeWrapper<Omit<RemoveGlobalIdentityRolesResult, 'identity'> & { identity: ResolversTypes['Identity'] }>
	RemoveMailTemplateError: ResolverTypeWrapper<RemoveMailTemplateError>
	RemoveMailTemplateErrorCode: RemoveMailTemplateErrorCode
	RemoveMailTemplateResponse: ResolverTypeWrapper<RemoveMailTemplateResponse>
	RemoveProjectMemberError: ResolverTypeWrapper<RemoveProjectMemberError>
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	RemoveProjectMemberResponse: ResolverTypeWrapper<RemoveProjectMemberResponse>
	ResetPasswordError: ResolverTypeWrapper<ResetPasswordError>
	ResetPasswordErrorCode: ResetPasswordErrorCode
	ResetPasswordResponse: ResolverTypeWrapper<ResetPasswordResponse>
	RoleConditionVariableDefinition: ResolverTypeWrapper<RoleConditionVariableDefinition>
	RoleDefinition: ResolverTypeWrapper<Omit<RoleDefinition, 'variables'> & { variables: ReadonlyArray<ResolversTypes['RoleVariableDefinition']> }>
	RoleEntityVariableDefinition: ResolverTypeWrapper<RoleEntityVariableDefinition>
	RolePredefinedVariableDefinition: ResolverTypeWrapper<RolePredefinedVariableDefinition>
	RoleVariableDefinition: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['RoleVariableDefinition']>
	SetProjectSecretError: ResolverTypeWrapper<SetProjectSecretError>
	SetProjectSecretErrorCode: SetProjectSecretErrorCode
	SetProjectSecretResponse: ResolverTypeWrapper<SetProjectSecretResponse>
	SignInError: ResolverTypeWrapper<SignInError>
	SignInErrorCode: SignInErrorCode
	SignInIDPError: ResolverTypeWrapper<SignInIdpError>
	SignInIDPErrorCode: SignInIdpErrorCode
	SignInIDPResponse: ResolverTypeWrapper<SignInIdpResponse>
	SignInIDPResult: ResolverTypeWrapper<SignInIdpResult>
	SignInPasswordlessError: ResolverTypeWrapper<SignInPasswordlessError>
	SignInPasswordlessErrorCode: SignInPasswordlessErrorCode
	SignInPasswordlessResponse: ResolverTypeWrapper<SignInPasswordlessResponse>
	SignInPasswordlessResult: ResolverTypeWrapper<SignInPasswordlessResult>
	SignInResponse: ResolverTypeWrapper<SignInResponse>
	SignInResult: ResolverTypeWrapper<SignInResult>
	SignOutError: ResolverTypeWrapper<SignOutError>
	SignOutErrorCode: SignOutErrorCode
	SignOutResponse: ResolverTypeWrapper<SignOutResponse>
	SignUpError: ResolverTypeWrapper<SignUpError>
	SignUpErrorCode: SignUpErrorCode
	SignUpResponse: ResolverTypeWrapper<SignUpResponse>
	SignUpResult: ResolverTypeWrapper<SignUpResult>
	String: ResolverTypeWrapper<Scalars['String']['output']>
	ToggleMyPasswordlessError: ResolverTypeWrapper<ToggleMyPasswordlessError>
	ToggleMyPasswordlessErrorCode: ToggleMyPasswordlessErrorCode
	ToggleMyPasswordlessResponse: ResolverTypeWrapper<ToggleMyPasswordlessResponse>
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateIDPError: ResolverTypeWrapper<UpdateIdpError>
	UpdateIDPErrorCode: UpdateIdpErrorCode
	UpdateIDPResponse: ResolverTypeWrapper<UpdateIdpResponse>
	UpdateProjectError: ResolverTypeWrapper<UpdateProjectError>
	UpdateProjectErrorCode: UpdateProjectErrorCode
	UpdateProjectMemberError: ResolverTypeWrapper<UpdateProjectMemberError>
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	UpdateProjectMemberResponse: ResolverTypeWrapper<UpdateProjectMemberResponse>
	UpdateProjectResponse: ResolverTypeWrapper<UpdateProjectResponse>
	VariableEntry: ResolverTypeWrapper<VariableEntry>
	VariableEntryInput: VariableEntryInput
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	ActivatePasswordlessOtpError: ActivatePasswordlessOtpError
	ActivatePasswordlessOtpResponse: ActivatePasswordlessOtpResponse
	AddGlobalIdentityRolesError: AddGlobalIdentityRolesError
	AddGlobalIdentityRolesResponse: Omit<AddGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversParentTypes['AddGlobalIdentityRolesResult']> }
	AddGlobalIdentityRolesResult: Omit<AddGlobalIdentityRolesResult, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	AddIDPError: AddIdpError
	AddIDPResponse: AddIdpResponse
	AddMailTemplateError: AddMailTemplateError
	AddMailTemplateResponse: AddMailTemplateResponse
	AddProjectMemberError: AddProjectMemberError
	AddProjectMemberResponse: AddProjectMemberResponse
	ApiKey: Omit<ApiKey, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	ApiKeyWithToken: Omit<ApiKeyWithToken, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	Boolean: Scalars['Boolean']['output']
	ChangeMyPasswordError: ChangeMyPasswordError
	ChangeMyPasswordResponse: ChangeMyPasswordResponse
	ChangeMyProfileError: ChangeMyProfileError
	ChangeMyProfileResponse: ChangeMyProfileResponse
	ChangePasswordError: ChangePasswordError
	ChangePasswordResponse: ChangePasswordResponse
	ChangeProfileError: ChangeProfileError
	ChangeProfileResponse: ChangeProfileResponse
	CheckResetPasswordTokenResult: CheckResetPasswordTokenResult
	CommonSignInResult: ResolversInterfaceTypes<ResolversParentTypes>['CommonSignInResult']
	Config: Config
	ConfigInput: ConfigInput
	ConfigPasswordless: ConfigPasswordless
	ConfigPasswordlessInput: ConfigPasswordlessInput
	ConfigureError: ConfigureError
	ConfigureResponse: ConfigureResponse
	ConfirmOtpError: ConfirmOtpError
	ConfirmOtpResponse: ConfirmOtpResponse
	CreateApiKeyError: CreateApiKeyError
	CreateApiKeyResponse: Omit<CreateApiKeyResponse, 'result'> & { result?: Maybe<ResolversParentTypes['CreateApiKeyResult']> }
	CreateApiKeyResult: Omit<CreateApiKeyResult, 'apiKey'> & { apiKey: ResolversParentTypes['ApiKeyWithToken'] }
	CreatePasswordResetRequestError: CreatePasswordResetRequestError
	CreatePasswordResetRequestResponse: CreatePasswordResetRequestResponse
	CreateProjectOptions: CreateProjectOptions
	CreateProjectResponse: Omit<CreateProjectResponse, 'result'> & { result?: Maybe<ResolversParentTypes['CreateProjectResult']> }
	CreateProjectResponseError: CreateProjectResponseError
	CreateProjectResult: Omit<CreateProjectResult, 'deployerApiKey'> & { deployerApiKey?: Maybe<ResolversParentTypes['ApiKeyWithToken']> }
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: CreateSessionTokenError
	CreateSessionTokenResponse: CreateSessionTokenResponse
	CreateSessionTokenResult: CreateSessionTokenResult
	DateTime: Scalars['DateTime']['output']
	DisableApiKeyError: DisableApiKeyError
	DisableApiKeyResponse: DisableApiKeyResponse
	DisableIDPError: DisableIdpError
	DisableIDPResponse: DisableIdpResponse
	DisableOtpError: DisableOtpError
	DisableOtpResponse: DisableOtpResponse
	DisablePersonError: DisablePersonError
	DisablePersonResponse: DisablePersonResponse
	EnableIDPError: EnableIdpError
	EnableIDPResponse: EnableIdpResponse
	IDPOptions: IdpOptions
	IDPOptionsOutput: IdpOptionsOutput
	IDPResponseInput: IdpResponseInput
	Identity: Omit<Identity, 'apiKey' | 'projects'> & { apiKey?: Maybe<ResolversParentTypes['ApiKey']>; projects: ReadonlyArray<ResolversParentTypes['IdentityProjectRelation']> }
	IdentityGlobalPermissions: IdentityGlobalPermissions
	IdentityProjectRelation: Omit<IdentityProjectRelation, 'project'> & { project: ResolversParentTypes['Project'] }
	IdentityProvider: IdentityProvider
	InitSignInIDPError: InitSignInIdpError
	InitSignInIDPResponse: InitSignInIdpResponse
	InitSignInIDPResult: InitSignInIdpResult
	InitSignInPasswordlessError: InitSignInPasswordlessError
	InitSignInPasswordlessOptions: InitSignInPasswordlessOptions
	InitSignInPasswordlessResponse: InitSignInPasswordlessResponse
	InitSignInPasswordlessResult: InitSignInPasswordlessResult
	Int: Scalars['Int']['output']
	InviteError: InviteError
	InviteOptions: InviteOptions
	InviteResponse: InviteResponse
	InviteResult: InviteResult
	Json: Scalars['Json']['output']
	MailTemplate: MailTemplate
	MailTemplateData: MailTemplateData
	MailTemplateIdentifier: MailTemplateIdentifier
	Membership: Membership
	MembershipInput: MembershipInput
	MembershipValidationError: MembershipValidationError
	Mutation: {}
	Person: Omit<Person, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	PrepareOtpResponse: PrepareOtpResponse
	PrepareOtpResult: PrepareOtpResult
	Project: Omit<Project, 'members' | 'roles'> & { members: ReadonlyArray<ResolversParentTypes['ProjectIdentityRelation']>; roles: ReadonlyArray<ResolversParentTypes['RoleDefinition']> }
	ProjectIdentityRelation: Omit<ProjectIdentityRelation, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	ProjectMembersFilter: ProjectMembersFilter
	ProjectMembersInput: ProjectMembersInput
	ProjectSecret: ProjectSecret
	Query: {}
	RemoveGlobalIdentityRolesError: RemoveGlobalIdentityRolesError
	RemoveGlobalIdentityRolesResponse: Omit<RemoveGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversParentTypes['RemoveGlobalIdentityRolesResult']> }
	RemoveGlobalIdentityRolesResult: Omit<RemoveGlobalIdentityRolesResult, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	RemoveMailTemplateError: RemoveMailTemplateError
	RemoveMailTemplateResponse: RemoveMailTemplateResponse
	RemoveProjectMemberError: RemoveProjectMemberError
	RemoveProjectMemberResponse: RemoveProjectMemberResponse
	ResetPasswordError: ResetPasswordError
	ResetPasswordResponse: ResetPasswordResponse
	RoleConditionVariableDefinition: RoleConditionVariableDefinition
	RoleDefinition: Omit<RoleDefinition, 'variables'> & { variables: ReadonlyArray<ResolversParentTypes['RoleVariableDefinition']> }
	RoleEntityVariableDefinition: RoleEntityVariableDefinition
	RolePredefinedVariableDefinition: RolePredefinedVariableDefinition
	RoleVariableDefinition: ResolversInterfaceTypes<ResolversParentTypes>['RoleVariableDefinition']
	SetProjectSecretError: SetProjectSecretError
	SetProjectSecretResponse: SetProjectSecretResponse
	SignInError: SignInError
	SignInIDPError: SignInIdpError
	SignInIDPResponse: SignInIdpResponse
	SignInIDPResult: SignInIdpResult
	SignInPasswordlessError: SignInPasswordlessError
	SignInPasswordlessResponse: SignInPasswordlessResponse
	SignInPasswordlessResult: SignInPasswordlessResult
	SignInResponse: SignInResponse
	SignInResult: SignInResult
	SignOutError: SignOutError
	SignOutResponse: SignOutResponse
	SignUpError: SignUpError
	SignUpResponse: SignUpResponse
	SignUpResult: SignUpResult
	String: Scalars['String']['output']
	ToggleMyPasswordlessError: ToggleMyPasswordlessError
	ToggleMyPasswordlessResponse: ToggleMyPasswordlessResponse
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateIDPError: UpdateIdpError
	UpdateIDPResponse: UpdateIdpResponse
	UpdateProjectError: UpdateProjectError
	UpdateProjectMemberError: UpdateProjectMemberError
	UpdateProjectMemberResponse: UpdateProjectMemberResponse
	UpdateProjectResponse: UpdateProjectResponse
	VariableEntry: VariableEntry
	VariableEntryInput: VariableEntryInput
}

export type ActivatePasswordlessOtpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivatePasswordlessOtpError'] = ResolversParentTypes['ActivatePasswordlessOtpError']> = {
	code?: Resolver<ResolversTypes['ActivatePasswordlessOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ActivatePasswordlessOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivatePasswordlessOtpResponse'] = ResolversParentTypes['ActivatePasswordlessOtpResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ActivatePasswordlessOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddGlobalIdentityRolesErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddGlobalIdentityRolesError'] = ResolversParentTypes['AddGlobalIdentityRolesError']> = {
	code?: Resolver<ResolversTypes['AddGlobalIdentityRolesErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddGlobalIdentityRolesResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddGlobalIdentityRolesResponse'] = ResolversParentTypes['AddGlobalIdentityRolesResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['AddGlobalIdentityRolesError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['AddGlobalIdentityRolesResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddGlobalIdentityRolesResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddGlobalIdentityRolesResult'] = ResolversParentTypes['AddGlobalIdentityRolesResult']> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
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
	error?: Resolver<Maybe<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddProjectMemberError'] = ResolversParentTypes['AddProjectMemberError']> = {
	code?: Resolver<ResolversTypes['AddProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AddProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddProjectMemberResponse'] = ResolversParentTypes['AddProjectMemberResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ApiKeyResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ApiKeyWithTokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiKeyWithToken'] = ResolversParentTypes['ApiKeyWithToken']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyPasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyPasswordError'] = ResolversParentTypes['ChangeMyPasswordError']> = {
	code?: Resolver<ResolversTypes['ChangeMyPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyPasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyPasswordResponse'] = ResolversParentTypes['ChangeMyPasswordResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeMyPasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyProfileErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyProfileError'] = ResolversParentTypes['ChangeMyProfileError']> = {
	code?: Resolver<ResolversTypes['ChangeMyProfileErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeMyProfileResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeMyProfileResponse'] = ResolversParentTypes['ChangeMyProfileResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeMyProfileError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangePasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangePasswordError'] = ResolversParentTypes['ChangePasswordError']> = {
	code?: Resolver<ResolversTypes['ChangePasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangePasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangePasswordResponse'] = ResolversParentTypes['ChangePasswordResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeProfileErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeProfileError'] = ResolversParentTypes['ChangeProfileError']> = {
	code?: Resolver<ResolversTypes['ChangeProfileErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ChangeProfileResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeProfileResponse'] = ResolversParentTypes['ChangeProfileResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeProfileError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CheckResetPasswordTokenResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CheckResetPasswordTokenResult'] = ResolversParentTypes['CheckResetPasswordTokenResult']> = {
	code?: Resolver<ResolversTypes['CheckResetPasswordTokenCode'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CommonSignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommonSignInResult'] = ResolversParentTypes['CommonSignInResult']> = {
	__resolveType: TypeResolveFn<'CreateSessionTokenResult' | 'SignInIDPResult' | 'SignInPasswordlessResult' | 'SignInResult', ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['Config'] = ResolversParentTypes['Config']> = {
	passwordless?: Resolver<ResolversTypes['ConfigPasswordless'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigPasswordlessResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigPasswordless'] = ResolversParentTypes['ConfigPasswordless']> = {
	enabled?: Resolver<ResolversTypes['ConfigPolicy'], ParentType, ContextType>
	expirationMinutes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigureErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigureError'] = ResolversParentTypes['ConfigureError']> = {
	code?: Resolver<ResolversTypes['ConfigureErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigureResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigureResponse'] = ResolversParentTypes['ConfigureResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ConfigureError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfirmOtpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfirmOtpError'] = ResolversParentTypes['ConfirmOtpError']> = {
	code?: Resolver<ResolversTypes['ConfirmOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfirmOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfirmOtpResponse'] = ResolversParentTypes['ConfirmOtpResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateApiKeyErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateApiKeyError'] = ResolversParentTypes['CreateApiKeyError']> = {
	code?: Resolver<ResolversTypes['CreateApiKeyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateApiKeyResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateApiKeyResponse'] = ResolversParentTypes['CreateApiKeyResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
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
	error?: Resolver<Maybe<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResponse'] = ResolversParentTypes['CreateProjectResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['CreateProjectResponseError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateProjectResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResponseErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResponseError'] = ResolversParentTypes['CreateProjectResponseError']> = {
	code?: Resolver<ResolversTypes['CreateProjectResponseErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateProjectResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResult'] = ResolversParentTypes['CreateProjectResult']> = {
	deployerApiKey?: Resolver<Maybe<ResolversTypes['ApiKeyWithToken']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenError'] = ResolversParentTypes['CreateSessionTokenError']> = {
	code?: Resolver<ResolversTypes['CreateSessionTokenErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenResponse'] = ResolversParentTypes['CreateSessionTokenResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['CreateSessionTokenError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CreateSessionTokenResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateSessionTokenResult'] = ResolversParentTypes['CreateSessionTokenResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
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
	error?: Resolver<Maybe<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
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
	error?: Resolver<Maybe<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisablePersonErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisablePersonError'] = ResolversParentTypes['DisablePersonError']> = {
	code?: Resolver<ResolversTypes['DisablePersonErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DisablePersonResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisablePersonResponse'] = ResolversParentTypes['DisablePersonResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['DisablePersonError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
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

export type IdpOptionsOutputResolvers<ContextType = any, ParentType extends ResolversParentTypes['IDPOptionsOutput'] = ResolversParentTypes['IDPOptionsOutput']> = {
	autoSignUp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	exclusive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	initReturnsConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
	apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType>
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	permissions?: Resolver<Maybe<ResolversTypes['IdentityGlobalPermissions']>, ParentType, ContextType>
	person?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['IdentityProjectRelation']>, ParentType, ContextType>
	roles?: Resolver<Maybe<ReadonlyArray<ResolversTypes['String']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityGlobalPermissionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityGlobalPermissions'] = ResolversParentTypes['IdentityGlobalPermissions']> = {
	canCreateProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	canDeployEntrypoint?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityProjectRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityProjectRelation'] = ResolversParentTypes['IdentityProjectRelation']> = {
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IdentityProviderResolvers<ContextType = any, ParentType extends ResolversParentTypes['IdentityProvider'] = ResolversParentTypes['IdentityProvider']> = {
	configuration?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	disabledAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	options?: Resolver<ResolversTypes['IDPOptionsOutput'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPError'] = ResolversParentTypes['InitSignInIDPError']> = {
	code?: Resolver<ResolversTypes['InitSignInIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPResponse'] = ResolversParentTypes['InitSignInIDPResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InitSignInIDPResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInIdpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInIDPResult'] = ResolversParentTypes['InitSignInIDPResult']> = {
	authUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	idpConfiguration?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	sessionData?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInPasswordlessErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInPasswordlessError'] = ResolversParentTypes['InitSignInPasswordlessError']> = {
	code?: Resolver<ResolversTypes['InitSignInPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInPasswordlessResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInPasswordlessResponse'] = ResolversParentTypes['InitSignInPasswordlessResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['InitSignInPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InitSignInPasswordlessResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InitSignInPasswordlessResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InitSignInPasswordlessResult'] = ResolversParentTypes['InitSignInPasswordlessResult']> = {
	expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	requestId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteError'] = ResolversParentTypes['InviteError']> = {
	code?: Resolver<ResolversTypes['InviteErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteResponse'] = ResolversParentTypes['InviteResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['InviteError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InviteError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InviteResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InviteResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteResult'] = ResolversParentTypes['InviteResult']> = {
	isNew?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MailTemplateDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['MailTemplateData'] = ResolversParentTypes['MailTemplateData']> = {
	content?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	projectSlug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	replyTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['MailType'], ParentType, ContextType>
	useLayout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	variant?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
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
	activatePasswordlessOtp?: Resolver<Maybe<ResolversTypes['ActivatePasswordlessOtpResponse']>, ParentType, ContextType, RequireFields<MutationActivatePasswordlessOtpArgs, 'otpHash' | 'requestId' | 'token'>>
	addGlobalIdentityRoles?: Resolver<Maybe<ResolversTypes['AddGlobalIdentityRolesResponse']>, ParentType, ContextType, RequireFields<MutationAddGlobalIdentityRolesArgs, 'identityId' | 'roles'>>
	addIDP?: Resolver<Maybe<ResolversTypes['AddIDPResponse']>, ParentType, ContextType, RequireFields<MutationAddIdpArgs, 'configuration' | 'identityProvider' | 'type'>>
	addMailTemplate?: Resolver<Maybe<ResolversTypes['AddMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationAddMailTemplateArgs, 'template'>>
	addProjectMailTemplate?: Resolver<Maybe<ResolversTypes['AddMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationAddProjectMailTemplateArgs, 'template'>>
	addProjectMember?: Resolver<Maybe<ResolversTypes['AddProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationAddProjectMemberArgs, 'identityId' | 'memberships' | 'projectSlug'>>
	changeMyPassword?: Resolver<Maybe<ResolversTypes['ChangeMyPasswordResponse']>, ParentType, ContextType, RequireFields<MutationChangeMyPasswordArgs, 'currentPassword' | 'newPassword'>>
	changeMyProfile?: Resolver<Maybe<ResolversTypes['ChangeMyProfileResponse']>, ParentType, ContextType, Partial<MutationChangeMyProfileArgs>>
	changePassword?: Resolver<Maybe<ResolversTypes['ChangePasswordResponse']>, ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'password' | 'personId'>>
	changeProfile?: Resolver<Maybe<ResolversTypes['ChangeProfileResponse']>, ParentType, ContextType, RequireFields<MutationChangeProfileArgs, 'personId'>>
	configure?: Resolver<Maybe<ResolversTypes['ConfigureResponse']>, ParentType, ContextType, RequireFields<MutationConfigureArgs, 'config'>>
	confirmOtp?: Resolver<Maybe<ResolversTypes['ConfirmOtpResponse']>, ParentType, ContextType, RequireFields<MutationConfirmOtpArgs, 'otpToken'>>
	createApiKey?: Resolver<Maybe<ResolversTypes['CreateApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'description' | 'memberships' | 'projectSlug'>>
	createGlobalApiKey?: Resolver<Maybe<ResolversTypes['CreateApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationCreateGlobalApiKeyArgs, 'description'>>
	createProject?: Resolver<Maybe<ResolversTypes['CreateProjectResponse']>, ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'projectSlug'>>
	createResetPasswordRequest?: Resolver<Maybe<ResolversTypes['CreatePasswordResetRequestResponse']>, ParentType, ContextType, RequireFields<MutationCreateResetPasswordRequestArgs, 'email'>>
	createSessionToken?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResponse']>, ParentType, ContextType, Partial<MutationCreateSessionTokenArgs>>
	disableApiKey?: Resolver<Maybe<ResolversTypes['DisableApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationDisableApiKeyArgs, 'id'>>
	disableIDP?: Resolver<Maybe<ResolversTypes['DisableIDPResponse']>, ParentType, ContextType, RequireFields<MutationDisableIdpArgs, 'identityProvider'>>
	disableMyPasswordless?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessResponse']>, ParentType, ContextType>
	disableOtp?: Resolver<Maybe<ResolversTypes['DisableOtpResponse']>, ParentType, ContextType>
	disablePerson?: Resolver<Maybe<ResolversTypes['DisablePersonResponse']>, ParentType, ContextType, RequireFields<MutationDisablePersonArgs, 'personId'>>
	enableIDP?: Resolver<Maybe<ResolversTypes['EnableIDPResponse']>, ParentType, ContextType, RequireFields<MutationEnableIdpArgs, 'identityProvider'>>
	enableMyPasswordless?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessResponse']>, ParentType, ContextType>
	initSignInIDP?: Resolver<Maybe<ResolversTypes['InitSignInIDPResponse']>, ParentType, ContextType, RequireFields<MutationInitSignInIdpArgs, 'identityProvider'>>
	initSignInPasswordless?: Resolver<Maybe<ResolversTypes['InitSignInPasswordlessResponse']>, ParentType, ContextType, RequireFields<MutationInitSignInPasswordlessArgs, 'email'>>
	invite?: Resolver<Maybe<ResolversTypes['InviteResponse']>, ParentType, ContextType, RequireFields<MutationInviteArgs, 'email' | 'memberships' | 'projectSlug'>>
	prepareOtp?: Resolver<Maybe<ResolversTypes['PrepareOtpResponse']>, ParentType, ContextType, Partial<MutationPrepareOtpArgs>>
	removeGlobalIdentityRoles?: Resolver<Maybe<ResolversTypes['RemoveGlobalIdentityRolesResponse']>, ParentType, ContextType, RequireFields<MutationRemoveGlobalIdentityRolesArgs, 'identityId' | 'roles'>>
	removeMailTemplate?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationRemoveMailTemplateArgs, 'templateIdentifier'>>
	removeProjectMailTemplate?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateResponse']>, ParentType, ContextType, RequireFields<MutationRemoveProjectMailTemplateArgs, 'templateIdentifier'>>
	removeProjectMember?: Resolver<Maybe<ResolversTypes['RemoveProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationRemoveProjectMemberArgs, 'identityId' | 'projectSlug'>>
	resetPassword?: Resolver<Maybe<ResolversTypes['ResetPasswordResponse']>, ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'password' | 'token'>>
	setProjectSecret?: Resolver<Maybe<ResolversTypes['SetProjectSecretResponse']>, ParentType, ContextType, RequireFields<MutationSetProjectSecretArgs, 'key' | 'projectSlug' | 'value'>>
	signIn?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationSignInArgs, 'email' | 'password'>>
	signInIDP?: Resolver<Maybe<ResolversTypes['SignInIDPResponse']>, ParentType, ContextType, RequireFields<MutationSignInIdpArgs, 'identityProvider'>>
	signInPasswordless?: Resolver<Maybe<ResolversTypes['SignInPasswordlessResponse']>, ParentType, ContextType, RequireFields<MutationSignInPasswordlessArgs, 'requestId' | 'token' | 'validationType'>>
	signOut?: Resolver<Maybe<ResolversTypes['SignOutResponse']>, ParentType, ContextType, Partial<MutationSignOutArgs>>
	signUp?: Resolver<Maybe<ResolversTypes['SignUpResponse']>, ParentType, ContextType, RequireFields<MutationSignUpArgs, 'email'>>
	unmanagedInvite?: Resolver<Maybe<ResolversTypes['InviteResponse']>, ParentType, ContextType, RequireFields<MutationUnmanagedInviteArgs, 'email' | 'memberships' | 'projectSlug'>>
	updateIDP?: Resolver<Maybe<ResolversTypes['UpdateIDPResponse']>, ParentType, ContextType, RequireFields<MutationUpdateIdpArgs, 'identityProvider'>>
	updateProject?: Resolver<Maybe<ResolversTypes['UpdateProjectResponse']>, ParentType, ContextType, RequireFields<MutationUpdateProjectArgs, 'projectSlug'>>
	updateProjectMember?: Resolver<Maybe<ResolversTypes['UpdateProjectMemberResponse']>, ParentType, ContextType, RequireFields<MutationUpdateProjectMemberArgs, 'identityId' | 'memberships' | 'projectSlug'>>
}

export type PersonResolvers<ContextType = any, ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']> = {
	email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	otpEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	passwordlessEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type PrepareOtpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['PrepareOtpResponse'] = ResolversParentTypes['PrepareOtpResponse']> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['PrepareOtpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type PrepareOtpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['PrepareOtpResult'] = ResolversParentTypes['PrepareOtpResult']> = {
	otpSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
	config?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	members?: Resolver<ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>, ParentType, ContextType, Partial<ProjectMembersArgs>>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['RoleDefinition']>, ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ProjectIdentityRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectIdentityRelation'] = ResolversParentTypes['ProjectIdentityRelation']> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	checkResetPasswordToken?: Resolver<ResolversTypes['CheckResetPasswordTokenCode'], ParentType, ContextType, RequireFields<QueryCheckResetPasswordTokenArgs, 'requestId' | 'token'>>
	configuration?: Resolver<ResolversTypes['Config'], ParentType, ContextType>
	identityProviders?: Resolver<ReadonlyArray<ResolversTypes['IdentityProvider']>, ParentType, ContextType>
	mailTemplates?: Resolver<ReadonlyArray<ResolversTypes['MailTemplateData']>, ParentType, ContextType>
	me?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	personById?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType, RequireFields<QueryPersonByIdArgs, 'id'>>
	projectBySlug?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType, RequireFields<QueryProjectBySlugArgs, 'slug'>>
	projectMemberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType, RequireFields<QueryProjectMembershipsArgs, 'identityId' | 'projectSlug'>>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesError'] = ResolversParentTypes['RemoveGlobalIdentityRolesError']> = {
	code?: Resolver<ResolversTypes['RemoveGlobalIdentityRolesErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesResponse'] = ResolversParentTypes['RemoveGlobalIdentityRolesResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveGlobalIdentityRolesError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['RemoveGlobalIdentityRolesResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesResult'] = ResolversParentTypes['RemoveGlobalIdentityRolesResult']> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveMailTemplateErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveMailTemplateError'] = ResolversParentTypes['RemoveMailTemplateError']> = {
	code?: Resolver<ResolversTypes['RemoveMailTemplateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveMailTemplateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveMailTemplateResponse'] = ResolversParentTypes['RemoveMailTemplateResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveProjectMemberError'] = ResolversParentTypes['RemoveProjectMemberError']> = {
	code?: Resolver<ResolversTypes['RemoveProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RemoveProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['RemoveProjectMemberResponse'] = ResolversParentTypes['RemoveProjectMemberResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ResetPasswordErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResetPasswordError'] = ResolversParentTypes['ResetPasswordError']> = {
	code?: Resolver<ResolversTypes['ResetPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ResetPasswordResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResetPasswordResponse'] = ResolversParentTypes['ResetPasswordResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleConditionVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleConditionVariableDefinition'] = ResolversParentTypes['RoleConditionVariableDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleDefinition'] = ResolversParentTypes['RoleDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['RoleVariableDefinition']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleEntityVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleEntityVariableDefinition'] = ResolversParentTypes['RoleEntityVariableDefinition']> = {
	entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RolePredefinedVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RolePredefinedVariableDefinition'] = ResolversParentTypes['RolePredefinedVariableDefinition']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	value?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleVariableDefinitionResolvers<ContextType = any, ParentType extends ResolversParentTypes['RoleVariableDefinition'] = ResolversParentTypes['RoleVariableDefinition']> = {
	__resolveType: TypeResolveFn<'RoleConditionVariableDefinition' | 'RoleEntityVariableDefinition' | 'RolePredefinedVariableDefinition', ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type SetProjectSecretErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SetProjectSecretError'] = ResolversParentTypes['SetProjectSecretError']> = {
	code?: Resolver<ResolversTypes['SetProjectSecretErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SetProjectSecretResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SetProjectSecretResponse'] = ResolversParentTypes['SetProjectSecretResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['SetProjectSecretError']>, ParentType, ContextType>
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
	error?: Resolver<Maybe<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInIDPResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInIdpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInIDPResult'] = ResolversParentTypes['SignInIDPResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInPasswordlessErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInPasswordlessError'] = ResolversParentTypes['SignInPasswordlessError']> = {
	code?: Resolver<ResolversTypes['SignInPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInPasswordlessResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInPasswordlessResponse'] = ResolversParentTypes['SignInPasswordlessResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['SignInPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInPasswordlessResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInPasswordlessResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInPasswordlessResult'] = ResolversParentTypes['SignInPasswordlessResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['SignInError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignOutErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignOutError'] = ResolversParentTypes['SignOutError']> = {
	code?: Resolver<ResolversTypes['SignOutErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignOutResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignOutResponse'] = ResolversParentTypes['SignOutResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['SignOutError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignOutError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpError'] = ResolversParentTypes['SignUpError']> = {
	code?: Resolver<ResolversTypes['SignUpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['SignUpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignUpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignUpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignUpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpResult'] = ResolversParentTypes['SignUpResult']> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ToggleMyPasswordlessErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ToggleMyPasswordlessError'] = ResolversParentTypes['ToggleMyPasswordlessError']> = {
	code?: Resolver<ResolversTypes['ToggleMyPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ToggleMyPasswordlessResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ToggleMyPasswordlessResponse'] = ResolversParentTypes['ToggleMyPasswordlessResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
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

export type UpdateProjectErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectError'] = ResolversParentTypes['UpdateProjectError']> = {
	code?: Resolver<ResolversTypes['UpdateProjectErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectMemberErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectMemberError'] = ResolversParentTypes['UpdateProjectMemberError']> = {
	code?: Resolver<ResolversTypes['UpdateProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectMemberResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectMemberResponse'] = ResolversParentTypes['UpdateProjectMemberResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UpdateProjectResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateProjectResponse'] = ResolversParentTypes['UpdateProjectResponse']> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateProjectError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type VariableEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['VariableEntry'] = ResolversParentTypes['VariableEntry']> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	values?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	ActivatePasswordlessOtpError?: ActivatePasswordlessOtpErrorResolvers<ContextType>
	ActivatePasswordlessOtpResponse?: ActivatePasswordlessOtpResponseResolvers<ContextType>
	AddGlobalIdentityRolesError?: AddGlobalIdentityRolesErrorResolvers<ContextType>
	AddGlobalIdentityRolesResponse?: AddGlobalIdentityRolesResponseResolvers<ContextType>
	AddGlobalIdentityRolesResult?: AddGlobalIdentityRolesResultResolvers<ContextType>
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
	ChangeMyProfileError?: ChangeMyProfileErrorResolvers<ContextType>
	ChangeMyProfileResponse?: ChangeMyProfileResponseResolvers<ContextType>
	ChangePasswordError?: ChangePasswordErrorResolvers<ContextType>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<ContextType>
	ChangeProfileError?: ChangeProfileErrorResolvers<ContextType>
	ChangeProfileResponse?: ChangeProfileResponseResolvers<ContextType>
	CheckResetPasswordTokenResult?: CheckResetPasswordTokenResultResolvers<ContextType>
	CommonSignInResult?: CommonSignInResultResolvers<ContextType>
	Config?: ConfigResolvers<ContextType>
	ConfigPasswordless?: ConfigPasswordlessResolvers<ContextType>
	ConfigureError?: ConfigureErrorResolvers<ContextType>
	ConfigureResponse?: ConfigureResponseResolvers<ContextType>
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
	DisablePersonError?: DisablePersonErrorResolvers<ContextType>
	DisablePersonResponse?: DisablePersonResponseResolvers<ContextType>
	EnableIDPError?: EnableIdpErrorResolvers<ContextType>
	EnableIDPResponse?: EnableIdpResponseResolvers<ContextType>
	IDPOptionsOutput?: IdpOptionsOutputResolvers<ContextType>
	Identity?: IdentityResolvers<ContextType>
	IdentityGlobalPermissions?: IdentityGlobalPermissionsResolvers<ContextType>
	IdentityProjectRelation?: IdentityProjectRelationResolvers<ContextType>
	IdentityProvider?: IdentityProviderResolvers<ContextType>
	InitSignInIDPError?: InitSignInIdpErrorResolvers<ContextType>
	InitSignInIDPResponse?: InitSignInIdpResponseResolvers<ContextType>
	InitSignInIDPResult?: InitSignInIdpResultResolvers<ContextType>
	InitSignInPasswordlessError?: InitSignInPasswordlessErrorResolvers<ContextType>
	InitSignInPasswordlessResponse?: InitSignInPasswordlessResponseResolvers<ContextType>
	InitSignInPasswordlessResult?: InitSignInPasswordlessResultResolvers<ContextType>
	InviteError?: InviteErrorResolvers<ContextType>
	InviteResponse?: InviteResponseResolvers<ContextType>
	InviteResult?: InviteResultResolvers<ContextType>
	Json?: GraphQLScalarType
	MailTemplateData?: MailTemplateDataResolvers<ContextType>
	Membership?: MembershipResolvers<ContextType>
	MembershipValidationError?: MembershipValidationErrorResolvers<ContextType>
	Mutation?: MutationResolvers<ContextType>
	Person?: PersonResolvers<ContextType>
	PrepareOtpResponse?: PrepareOtpResponseResolvers<ContextType>
	PrepareOtpResult?: PrepareOtpResultResolvers<ContextType>
	Project?: ProjectResolvers<ContextType>
	ProjectIdentityRelation?: ProjectIdentityRelationResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RemoveGlobalIdentityRolesError?: RemoveGlobalIdentityRolesErrorResolvers<ContextType>
	RemoveGlobalIdentityRolesResponse?: RemoveGlobalIdentityRolesResponseResolvers<ContextType>
	RemoveGlobalIdentityRolesResult?: RemoveGlobalIdentityRolesResultResolvers<ContextType>
	RemoveMailTemplateError?: RemoveMailTemplateErrorResolvers<ContextType>
	RemoveMailTemplateResponse?: RemoveMailTemplateResponseResolvers<ContextType>
	RemoveProjectMemberError?: RemoveProjectMemberErrorResolvers<ContextType>
	RemoveProjectMemberResponse?: RemoveProjectMemberResponseResolvers<ContextType>
	ResetPasswordError?: ResetPasswordErrorResolvers<ContextType>
	ResetPasswordResponse?: ResetPasswordResponseResolvers<ContextType>
	RoleConditionVariableDefinition?: RoleConditionVariableDefinitionResolvers<ContextType>
	RoleDefinition?: RoleDefinitionResolvers<ContextType>
	RoleEntityVariableDefinition?: RoleEntityVariableDefinitionResolvers<ContextType>
	RolePredefinedVariableDefinition?: RolePredefinedVariableDefinitionResolvers<ContextType>
	RoleVariableDefinition?: RoleVariableDefinitionResolvers<ContextType>
	SetProjectSecretError?: SetProjectSecretErrorResolvers<ContextType>
	SetProjectSecretResponse?: SetProjectSecretResponseResolvers<ContextType>
	SignInError?: SignInErrorResolvers<ContextType>
	SignInIDPError?: SignInIdpErrorResolvers<ContextType>
	SignInIDPResponse?: SignInIdpResponseResolvers<ContextType>
	SignInIDPResult?: SignInIdpResultResolvers<ContextType>
	SignInPasswordlessError?: SignInPasswordlessErrorResolvers<ContextType>
	SignInPasswordlessResponse?: SignInPasswordlessResponseResolvers<ContextType>
	SignInPasswordlessResult?: SignInPasswordlessResultResolvers<ContextType>
	SignInResponse?: SignInResponseResolvers<ContextType>
	SignInResult?: SignInResultResolvers<ContextType>
	SignOutError?: SignOutErrorResolvers<ContextType>
	SignOutResponse?: SignOutResponseResolvers<ContextType>
	SignUpError?: SignUpErrorResolvers<ContextType>
	SignUpResponse?: SignUpResponseResolvers<ContextType>
	SignUpResult?: SignUpResultResolvers<ContextType>
	ToggleMyPasswordlessError?: ToggleMyPasswordlessErrorResolvers<ContextType>
	ToggleMyPasswordlessResponse?: ToggleMyPasswordlessResponseResolvers<ContextType>
	UpdateIDPError?: UpdateIdpErrorResolvers<ContextType>
	UpdateIDPResponse?: UpdateIdpResponseResolvers<ContextType>
	UpdateProjectError?: UpdateProjectErrorResolvers<ContextType>
	UpdateProjectMemberError?: UpdateProjectMemberErrorResolvers<ContextType>
	UpdateProjectMemberResponse?: UpdateProjectMemberResponseResolvers<ContextType>
	UpdateProjectResponse?: UpdateProjectResponseResolvers<ContextType>
	VariableEntry?: VariableEntryResolvers<ContextType>
}


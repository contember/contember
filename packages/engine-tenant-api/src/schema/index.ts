import { GraphQLResolveInfo } from 'graphql'
export type Maybe<T> = T | null
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
	{ [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type AddMailTemplateError = {
	readonly __typename?: 'AddMailTemplateError'
	readonly code: AddMailTemplateErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum AddMailTemplateErrorCode {
	MissingVariable = 'MISSING_VARIABLE',
	ProjectNotFound = 'PROJECT_NOT_FOUND',
}

export type AddMailTemplateResponse = {
	readonly __typename?: 'AddMailTemplateResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<AddMailTemplateError>
}

export type AddProjectMemberError = {
	readonly __typename?: 'AddProjectMemberError'
	readonly code: AddProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum AddProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	IdentityNotFound = 'IDENTITY_NOT_FOUND',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	AlreadyMember = 'ALREADY_MEMBER',
}

export type AddProjectMemberResponse = {
	readonly __typename?: 'AddProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<AddProjectMemberError>
}

export type AdminCredentials = {
	readonly email: Scalars['String']
	readonly password: Scalars['String']
}

export type ApiKey = {
	readonly __typename?: 'ApiKey'
	readonly id: Scalars['String']
	readonly identity: Identity
}

export type ApiKeyWithToken = {
	readonly __typename?: 'ApiKeyWithToken'
	readonly id: Scalars['String']
	readonly token: Scalars['String']
	readonly identity: Identity
}

export type ChangePasswordError = {
	readonly __typename?: 'ChangePasswordError'
	readonly code: ChangePasswordErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum ChangePasswordErrorCode {
	PersonNotFound = 'PERSON_NOT_FOUND',
	TooWeak = 'TOO_WEAK',
}

export type ChangePasswordResponse = {
	readonly __typename?: 'ChangePasswordResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ChangePasswordError>
}

export type ConfirmOtpError = {
	readonly __typename?: 'ConfirmOtpError'
	readonly code: ConfirmOtpErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum ConfirmOtpErrorCode {
	InvalidOtpToken = 'INVALID_OTP_TOKEN',
	NotPrepared = 'NOT_PREPARED',
}

export type ConfirmOtpResponse = {
	readonly __typename?: 'ConfirmOtpResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ConfirmOtpError>
}

export type CreateApiKeyError = {
	readonly __typename?: 'CreateApiKeyError'
	readonly code: CreateApiKeyErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum CreateApiKeyErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
}

export type CreateApiKeyResponse = {
	readonly __typename?: 'CreateApiKeyResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	readonly __typename?: 'CreateApiKeyResult'
	readonly apiKey: ApiKeyWithToken
}

export type DisableApiKeyError = {
	readonly __typename?: 'DisableApiKeyError'
	readonly code: DisableApiKeyErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum DisableApiKeyErrorCode {
	KeyNotFound = 'KEY_NOT_FOUND',
}

export type DisableApiKeyResponse = {
	readonly __typename?: 'DisableApiKeyResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<DisableApiKeyError>
}

export type DisableOtpError = {
	readonly __typename?: 'DisableOtpError'
	readonly code: DisableOtpErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum DisableOtpErrorCode {
	OtpNotActive = 'OTP_NOT_ACTIVE',
}

export type DisableOtpResponse = {
	readonly __typename?: 'DisableOtpResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<DisableOtpError>
}

export type Identity = {
	readonly __typename?: 'Identity'
	readonly id: Scalars['String']
	readonly person?: Maybe<Person>
	readonly apiKey?: Maybe<ApiKey>
	readonly projects: ReadonlyArray<IdentityProjectRelation>
}

export type IdentityProjectRelation = {
	readonly __typename?: 'IdentityProjectRelation'
	readonly project: Project
	readonly memberships: ReadonlyArray<Membership>
}

export type InviteError = {
	readonly __typename?: 'InviteError'
	readonly code: InviteErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum InviteErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	AlreadyMember = 'ALREADY_MEMBER',
}

export type InviteResponse = {
	readonly __typename?: 'InviteResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<InviteError>
	readonly result?: Maybe<InviteResult>
}

export type InviteResult = {
	readonly __typename?: 'InviteResult'
	readonly person: Person
	readonly isNew: Scalars['Boolean']
}

export type MailTemplate = {
	readonly projectSlug: Scalars['String']
	readonly type: MailType
	/** Custom mail variant identifier, e.g. a locale. */
	readonly variant?: Maybe<Scalars['String']>
	readonly subject: Scalars['String']
	readonly content: Scalars['String']
	readonly useLayout?: Maybe<Scalars['Boolean']>
}

export type MailTemplateIdentifier = {
	readonly projectSlug: Scalars['String']
	readonly type: MailType
	readonly variant?: Maybe<Scalars['String']>
}

export enum MailType {
	ExistingUserInvited = 'EXISTING_USER_INVITED',
	NewUserInvited = 'NEW_USER_INVITED',
}

export enum Member_Type {
	ApiKey = 'API_KEY',
	Person = 'PERSON',
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

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly setup?: Maybe<SetupResponse>
	readonly signUp?: Maybe<SignUpResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly invite?: Maybe<InviteResponse>
	readonly unmanagedInvite?: Maybe<InviteResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
	readonly disableApiKey?: Maybe<DisableApiKeyResponse>
	readonly prepareOtp?: Maybe<PrepareOtpResponse>
	readonly confirmOtp?: Maybe<ConfirmOtpResponse>
	readonly disableOtp?: Maybe<DisableOtpResponse>
	readonly addProjectMailTemplate?: Maybe<AddMailTemplateResponse>
	readonly removeProjectMailTemplate?: Maybe<RemoveMailTemplateResponse>
}

export type MutationSetupArgs = {
	superadmin: AdminCredentials
}

export type MutationSignUpArgs = {
	email: Scalars['String']
	password: Scalars['String']
}

export type MutationSignInArgs = {
	email: Scalars['String']
	password: Scalars['String']
	expiration?: Maybe<Scalars['Int']>
	otpToken?: Maybe<Scalars['String']>
}

export type MutationSignOutArgs = {
	all?: Maybe<Scalars['Boolean']>
}

export type MutationChangePasswordArgs = {
	personId: Scalars['String']
	password: Scalars['String']
}

export type MutationInviteArgs = {
	email: Scalars['String']
	projectSlug: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
}

export type MutationUnmanagedInviteArgs = {
	email: Scalars['String']
	projectSlug: Scalars['String']
	memberships: ReadonlyArray<MembershipInput>
	password: Scalars['String']
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
}

export type MutationDisableApiKeyArgs = {
	id: Scalars['String']
}

export type MutationPrepareOtpArgs = {
	label?: Maybe<Scalars['String']>
}

export type MutationConfirmOtpArgs = {
	otpToken: Scalars['String']
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
	readonly roles: ReadonlyArray<RoleDefinition>
	readonly members: ReadonlyArray<ProjectIdentityRelation>
}

export type ProjectMembersArgs = {
	memberType?: Maybe<Member_Type>
}

export type ProjectIdentityRelation = {
	readonly __typename?: 'ProjectIdentityRelation'
	readonly identity: Identity
	readonly memberships: ReadonlyArray<Membership>
}

export type Query = {
	readonly __typename?: 'Query'
	readonly me: Identity
	readonly projects: ReadonlyArray<Project>
	readonly projectBySlug?: Maybe<Project>
	readonly projectMemberships: ReadonlyArray<Membership>
}

export type QueryProjectBySlugArgs = {
	slug: Scalars['String']
}

export type QueryProjectMembershipsArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
}

export type RemoveMailTemplateError = {
	readonly __typename?: 'RemoveMailTemplateError'
	readonly code: RemoveMailTemplateErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum RemoveMailTemplateErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	TemplateNotFound = 'TEMPLATE_NOT_FOUND',
}

export type RemoveMailTemplateResponse = {
	readonly __typename?: 'RemoveMailTemplateResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveMailTemplateError>
}

export type RemoveProjectMemberError = {
	readonly __typename?: 'RemoveProjectMemberError'
	readonly code: RemoveProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum RemoveProjectMemberErrorCode {
	NotMember = 'NOT_MEMBER',
	ProjectNotFound = 'PROJECT_NOT_FOUND',
}

export type RemoveProjectMemberResponse = {
	readonly __typename?: 'RemoveProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
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

export type RoleVariableDefinition = {
	readonly name: Scalars['String']
}

export type SetupError = {
	readonly __typename?: 'SetupError'
	readonly code: SetupErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SetupErrorCode {
	SetupAlreadyDone = 'SETUP_ALREADY_DONE',
}

export type SetupResponse = {
	readonly __typename?: 'SetupResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SetupErrorCode>
	readonly result?: Maybe<SetupResult>
}

export type SetupResult = {
	readonly __typename?: 'SetupResult'
	readonly superadmin: Person
	readonly loginKey: ApiKeyWithToken
}

export type SignInError = {
	readonly __typename?: 'SignInError'
	readonly code: SignInErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignInErrorCode {
	UnknownEmail = 'UNKNOWN_EMAIL',
	InvalidPassword = 'INVALID_PASSWORD',
	OtpRequried = 'OTP_REQURIED',
	InvalidOtpToken = 'INVALID_OTP_TOKEN',
}

export type SignInResponse = {
	readonly __typename?: 'SignInResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignInError>
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = {
	readonly __typename?: 'SignInResult'
	readonly token: Scalars['String']
	readonly person: Person
}

export type SignOutError = {
	readonly __typename?: 'SignOutError'
	readonly code: SignOutErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignOutErrorCode {
	NotAPerson = 'NOT_A_PERSON',
}

export type SignOutResponse = {
	readonly __typename?: 'SignOutResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignOutError>
}

export type SignUpError = {
	readonly __typename?: 'SignUpError'
	readonly code: SignUpErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignUpErrorCode {
	EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
	TooWeak = 'TOO_WEAK',
}

export type SignUpResponse = {
	readonly __typename?: 'SignUpResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignUpError>
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	readonly __typename?: 'SignUpResult'
	readonly person: Person
}

export type UpdateProjectMemberError = {
	readonly __typename?: 'UpdateProjectMemberError'
	readonly code: UpdateProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum UpdateProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	NotMember = 'NOT_MEMBER',
}

export type UpdateProjectMemberResponse = {
	readonly __typename?: 'UpdateProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
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

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
	fragment: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
	selectionSet: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
	| LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
	| NewStitchingResolver<TResult, TParent, TContext, TArgs>
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| StitchingResolver<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
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
	info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	Query: ResolverTypeWrapper<{}>
	Identity: ResolverTypeWrapper<Identity>
	String: ResolverTypeWrapper<Scalars['String']>
	Person: ResolverTypeWrapper<Person>
	ApiKey: ResolverTypeWrapper<ApiKey>
	IdentityProjectRelation: ResolverTypeWrapper<IdentityProjectRelation>
	Project: ResolverTypeWrapper<Project>
	RoleDefinition: ResolverTypeWrapper<RoleDefinition>
	RoleVariableDefinition: ResolversTypes['RoleEntityVariableDefinition']
	MEMBER_TYPE: Member_Type
	ProjectIdentityRelation: ResolverTypeWrapper<ProjectIdentityRelation>
	Membership: ResolverTypeWrapper<Membership>
	VariableEntry: ResolverTypeWrapper<VariableEntry>
	Mutation: ResolverTypeWrapper<{}>
	AdminCredentials: AdminCredentials
	SetupResponse: ResolverTypeWrapper<SetupResponse>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	SetupErrorCode: SetupErrorCode
	SetupResult: ResolverTypeWrapper<SetupResult>
	ApiKeyWithToken: ResolverTypeWrapper<ApiKeyWithToken>
	SignUpResponse: ResolverTypeWrapper<SignUpResponse>
	SignUpError: ResolverTypeWrapper<SignUpError>
	SignUpErrorCode: SignUpErrorCode
	SignUpResult: ResolverTypeWrapper<SignUpResult>
	Int: ResolverTypeWrapper<Scalars['Int']>
	SignInResponse: ResolverTypeWrapper<SignInResponse>
	SignInError: ResolverTypeWrapper<SignInError>
	SignInErrorCode: SignInErrorCode
	SignInResult: ResolverTypeWrapper<SignInResult>
	SignOutResponse: ResolverTypeWrapper<SignOutResponse>
	SignOutError: ResolverTypeWrapper<SignOutError>
	SignOutErrorCode: SignOutErrorCode
	ChangePasswordResponse: ResolverTypeWrapper<ChangePasswordResponse>
	ChangePasswordError: ResolverTypeWrapper<ChangePasswordError>
	ChangePasswordErrorCode: ChangePasswordErrorCode
	MembershipInput: MembershipInput
	VariableEntryInput: VariableEntryInput
	InviteResponse: ResolverTypeWrapper<InviteResponse>
	InviteError: ResolverTypeWrapper<InviteError>
	InviteErrorCode: InviteErrorCode
	InviteResult: ResolverTypeWrapper<InviteResult>
	AddProjectMemberResponse: ResolverTypeWrapper<AddProjectMemberResponse>
	AddProjectMemberError: ResolverTypeWrapper<AddProjectMemberError>
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	RemoveProjectMemberResponse: ResolverTypeWrapper<RemoveProjectMemberResponse>
	RemoveProjectMemberError: ResolverTypeWrapper<RemoveProjectMemberError>
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	UpdateProjectMemberResponse: ResolverTypeWrapper<UpdateProjectMemberResponse>
	UpdateProjectMemberError: ResolverTypeWrapper<UpdateProjectMemberError>
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	CreateApiKeyResponse: ResolverTypeWrapper<CreateApiKeyResponse>
	CreateApiKeyError: ResolverTypeWrapper<CreateApiKeyError>
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResult: ResolverTypeWrapper<CreateApiKeyResult>
	DisableApiKeyResponse: ResolverTypeWrapper<DisableApiKeyResponse>
	DisableApiKeyError: ResolverTypeWrapper<DisableApiKeyError>
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	PrepareOtpResponse: ResolverTypeWrapper<PrepareOtpResponse>
	PrepareOtpResult: ResolverTypeWrapper<PrepareOtpResult>
	ConfirmOtpResponse: ResolverTypeWrapper<ConfirmOtpResponse>
	ConfirmOtpError: ResolverTypeWrapper<ConfirmOtpError>
	ConfirmOtpErrorCode: ConfirmOtpErrorCode
	DisableOtpResponse: ResolverTypeWrapper<DisableOtpResponse>
	DisableOtpError: ResolverTypeWrapper<DisableOtpError>
	DisableOtpErrorCode: DisableOtpErrorCode
	MailTemplate: MailTemplate
	MailType: MailType
	AddMailTemplateResponse: ResolverTypeWrapper<AddMailTemplateResponse>
	AddMailTemplateError: ResolverTypeWrapper<AddMailTemplateError>
	AddMailTemplateErrorCode: AddMailTemplateErrorCode
	MailTemplateIdentifier: MailTemplateIdentifier
	RemoveMailTemplateResponse: ResolverTypeWrapper<RemoveMailTemplateResponse>
	RemoveMailTemplateError: ResolverTypeWrapper<RemoveMailTemplateError>
	RemoveMailTemplateErrorCode: RemoveMailTemplateErrorCode
	SetupError: ResolverTypeWrapper<SetupError>
	RoleEntityVariableDefinition: ResolverTypeWrapper<RoleEntityVariableDefinition>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Query: {}
	Identity: Identity
	String: Scalars['String']
	Person: Person
	ApiKey: ApiKey
	IdentityProjectRelation: IdentityProjectRelation
	Project: Project
	RoleDefinition: RoleDefinition
	RoleVariableDefinition: ResolversParentTypes['RoleEntityVariableDefinition']
	MEMBER_TYPE: Member_Type
	ProjectIdentityRelation: ProjectIdentityRelation
	Membership: Membership
	VariableEntry: VariableEntry
	Mutation: {}
	AdminCredentials: AdminCredentials
	SetupResponse: SetupResponse
	Boolean: Scalars['Boolean']
	SetupErrorCode: SetupErrorCode
	SetupResult: SetupResult
	ApiKeyWithToken: ApiKeyWithToken
	SignUpResponse: SignUpResponse
	SignUpError: SignUpError
	SignUpErrorCode: SignUpErrorCode
	SignUpResult: SignUpResult
	Int: Scalars['Int']
	SignInResponse: SignInResponse
	SignInError: SignInError
	SignInErrorCode: SignInErrorCode
	SignInResult: SignInResult
	SignOutResponse: SignOutResponse
	SignOutError: SignOutError
	SignOutErrorCode: SignOutErrorCode
	ChangePasswordResponse: ChangePasswordResponse
	ChangePasswordError: ChangePasswordError
	ChangePasswordErrorCode: ChangePasswordErrorCode
	MembershipInput: MembershipInput
	VariableEntryInput: VariableEntryInput
	InviteResponse: InviteResponse
	InviteError: InviteError
	InviteErrorCode: InviteErrorCode
	InviteResult: InviteResult
	AddProjectMemberResponse: AddProjectMemberResponse
	AddProjectMemberError: AddProjectMemberError
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	RemoveProjectMemberResponse: RemoveProjectMemberResponse
	RemoveProjectMemberError: RemoveProjectMemberError
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	UpdateProjectMemberResponse: UpdateProjectMemberResponse
	UpdateProjectMemberError: UpdateProjectMemberError
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	CreateApiKeyResponse: CreateApiKeyResponse
	CreateApiKeyError: CreateApiKeyError
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResult: CreateApiKeyResult
	DisableApiKeyResponse: DisableApiKeyResponse
	DisableApiKeyError: DisableApiKeyError
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	PrepareOtpResponse: PrepareOtpResponse
	PrepareOtpResult: PrepareOtpResult
	ConfirmOtpResponse: ConfirmOtpResponse
	ConfirmOtpError: ConfirmOtpError
	ConfirmOtpErrorCode: ConfirmOtpErrorCode
	DisableOtpResponse: DisableOtpResponse
	DisableOtpError: DisableOtpError
	DisableOtpErrorCode: DisableOtpErrorCode
	MailTemplate: MailTemplate
	MailType: MailType
	AddMailTemplateResponse: AddMailTemplateResponse
	AddMailTemplateError: AddMailTemplateError
	AddMailTemplateErrorCode: AddMailTemplateErrorCode
	MailTemplateIdentifier: MailTemplateIdentifier
	RemoveMailTemplateResponse: RemoveMailTemplateResponse
	RemoveMailTemplateError: RemoveMailTemplateError
	RemoveMailTemplateErrorCode: RemoveMailTemplateErrorCode
	SetupError: SetupError
	RoleEntityVariableDefinition: RoleEntityVariableDefinition
}

export type AddMailTemplateErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddMailTemplateError'] = ResolversParentTypes['AddMailTemplateError']
> = {
	code?: Resolver<ResolversTypes['AddMailTemplateErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type AddMailTemplateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddMailTemplateResponse'] = ResolversParentTypes['AddMailTemplateResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type AddProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberError'] = ResolversParentTypes['AddProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['AddProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type AddProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberResponse'] = ResolversParentTypes['AddProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ApiKeyResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ApiKeyWithTokenResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ApiKeyWithToken'] = ResolversParentTypes['ApiKeyWithToken']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ChangePasswordErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordError'] = ResolversParentTypes['ChangePasswordError']
> = {
	code?: Resolver<ResolversTypes['ChangePasswordErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ChangePasswordResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordResponse'] = ResolversParentTypes['ChangePasswordResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ConfirmOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmOtpError'] = ResolversParentTypes['ConfirmOtpError']
> = {
	code?: Resolver<ResolversTypes['ConfirmOtpErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ConfirmOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmOtpResponse'] = ResolversParentTypes['ConfirmOtpResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type CreateApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyError'] = ResolversParentTypes['CreateApiKeyError']
> = {
	code?: Resolver<ResolversTypes['CreateApiKeyErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type CreateApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResponse'] = ResolversParentTypes['CreateApiKeyResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateApiKeyResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type CreateApiKeyResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResult'] = ResolversParentTypes['CreateApiKeyResult']
> = {
	apiKey?: Resolver<ResolversTypes['ApiKeyWithToken'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type DisableApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyError'] = ResolversParentTypes['DisableApiKeyError']
> = {
	code?: Resolver<ResolversTypes['DisableApiKeyErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type DisableApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyResponse'] = ResolversParentTypes['DisableApiKeyResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type DisableOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableOtpError'] = ResolversParentTypes['DisableOtpError']
> = {
	code?: Resolver<ResolversTypes['DisableOtpErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type DisableOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableOtpResponse'] = ResolversParentTypes['DisableOtpResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type IdentityResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType>
	apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['IdentityProjectRelation']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type IdentityProjectRelationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityProjectRelation'] = ResolversParentTypes['IdentityProjectRelation']
> = {
	project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type InviteErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InviteError'] = ResolversParentTypes['InviteError']
> = {
	code?: Resolver<ResolversTypes['InviteErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type InviteResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InviteResponse'] = ResolversParentTypes['InviteResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InviteError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InviteResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type InviteResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InviteResult'] = ResolversParentTypes['InviteResult']
> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	isNew?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type MembershipResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']
> = {
	role?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['VariableEntry']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type MutationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
	setup?: Resolver<
		Maybe<ResolversTypes['SetupResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSetupArgs, 'superadmin'>
	>
	signUp?: Resolver<
		Maybe<ResolversTypes['SignUpResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSignUpArgs, 'email' | 'password'>
	>
	signIn?: Resolver<
		Maybe<ResolversTypes['SignInResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSignInArgs, 'email' | 'password'>
	>
	signOut?: Resolver<
		Maybe<ResolversTypes['SignOutResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSignOutArgs, never>
	>
	changePassword?: Resolver<
		Maybe<ResolversTypes['ChangePasswordResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationChangePasswordArgs, 'personId' | 'password'>
	>
	invite?: Resolver<
		Maybe<ResolversTypes['InviteResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationInviteArgs, 'email' | 'projectSlug' | 'memberships'>
	>
	unmanagedInvite?: Resolver<
		Maybe<ResolversTypes['InviteResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUnmanagedInviteArgs, 'email' | 'projectSlug' | 'memberships' | 'password'>
	>
	addProjectMember?: Resolver<
		Maybe<ResolversTypes['AddProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddProjectMemberArgs, 'projectSlug' | 'identityId' | 'memberships'>
	>
	removeProjectMember?: Resolver<
		Maybe<ResolversTypes['RemoveProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveProjectMemberArgs, 'projectSlug' | 'identityId'>
	>
	updateProjectMember?: Resolver<
		Maybe<ResolversTypes['UpdateProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUpdateProjectMemberArgs, 'projectSlug' | 'identityId' | 'memberships'>
	>
	createApiKey?: Resolver<
		Maybe<ResolversTypes['CreateApiKeyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateApiKeyArgs, 'projectSlug' | 'memberships' | 'description'>
	>
	disableApiKey?: Resolver<
		Maybe<ResolversTypes['DisableApiKeyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDisableApiKeyArgs, 'id'>
	>
	prepareOtp?: Resolver<
		Maybe<ResolversTypes['PrepareOtpResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationPrepareOtpArgs, never>
	>
	confirmOtp?: Resolver<
		Maybe<ResolversTypes['ConfirmOtpResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationConfirmOtpArgs, 'otpToken'>
	>
	disableOtp?: Resolver<Maybe<ResolversTypes['DisableOtpResponse']>, ParentType, ContextType>
	addProjectMailTemplate?: Resolver<
		Maybe<ResolversTypes['AddMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddProjectMailTemplateArgs, 'template'>
	>
	removeProjectMailTemplate?: Resolver<
		Maybe<ResolversTypes['RemoveMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveProjectMailTemplateArgs, 'templateIdentifier'>
	>
}

export type PersonResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type PrepareOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PrepareOtpResponse'] = ResolversParentTypes['PrepareOtpResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['PrepareOtpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type PrepareOtpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PrepareOtpResult'] = ResolversParentTypes['PrepareOtpResult']
> = {
	otpUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ProjectResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['RoleDefinition']>, ParentType, ContextType>
	members?: Resolver<
		ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>,
		ParentType,
		ContextType,
		RequireFields<ProjectMembersArgs, never>
	>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type ProjectIdentityRelationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ProjectIdentityRelation'] = ResolversParentTypes['ProjectIdentityRelation']
> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
	me?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
	projectBySlug?: Resolver<
		Maybe<ResolversTypes['Project']>,
		ParentType,
		ContextType,
		RequireFields<QueryProjectBySlugArgs, 'slug'>
	>
	projectMemberships?: Resolver<
		ReadonlyArray<ResolversTypes['Membership']>,
		ParentType,
		ContextType,
		RequireFields<QueryProjectMembershipsArgs, 'projectSlug' | 'identityId'>
	>
}

export type RemoveMailTemplateErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveMailTemplateError'] = ResolversParentTypes['RemoveMailTemplateError']
> = {
	code?: Resolver<ResolversTypes['RemoveMailTemplateErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RemoveMailTemplateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveMailTemplateResponse'] = ResolversParentTypes['RemoveMailTemplateResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RemoveProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberError'] = ResolversParentTypes['RemoveProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['RemoveProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RemoveProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberResponse'] = ResolversParentTypes['RemoveProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RoleDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleDefinition'] = ResolversParentTypes['RoleDefinition']
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['RoleVariableDefinition']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RoleEntityVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleEntityVariableDefinition'] = ResolversParentTypes['RoleEntityVariableDefinition']
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type RoleVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleVariableDefinition'] = ResolversParentTypes['RoleVariableDefinition']
> = {
	__resolveType: TypeResolveFn<'RoleEntityVariableDefinition', ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type SetupErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupError'] = ResolversParentTypes['SetupError']
> = {
	code?: Resolver<ResolversTypes['SetupErrorCode'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SetupResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupResponse'] = ResolversParentTypes['SetupResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SetupErrorCode']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SetupResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SetupResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupResult'] = ResolversParentTypes['SetupResult']
> = {
	superadmin?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	loginKey?: Resolver<ResolversTypes['ApiKeyWithToken'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignInErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInError'] = ResolversParentTypes['SignInError']
> = {
	code?: Resolver<ResolversTypes['SignInErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignInResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignInResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']
> = {
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignOutErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignOutError'] = ResolversParentTypes['SignOutError']
> = {
	code?: Resolver<ResolversTypes['SignOutErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignOutResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignOutResponse'] = ResolversParentTypes['SignOutResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignOutError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignUpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpError'] = ResolversParentTypes['SignUpError']
> = {
	code?: Resolver<ResolversTypes['SignUpErrorCode'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignUpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignUpError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignUpResult']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type SignUpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpResult'] = ResolversParentTypes['SignUpResult']
> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type UpdateProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberError'] = ResolversParentTypes['UpdateProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['UpdateProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type UpdateProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberResponse'] = ResolversParentTypes['UpdateProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type VariableEntryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['VariableEntry'] = ResolversParentTypes['VariableEntry']
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	values?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type Resolvers<ContextType = any> = {
	AddMailTemplateError?: AddMailTemplateErrorResolvers<ContextType>
	AddMailTemplateResponse?: AddMailTemplateResponseResolvers<ContextType>
	AddProjectMemberError?: AddProjectMemberErrorResolvers<ContextType>
	AddProjectMemberResponse?: AddProjectMemberResponseResolvers<ContextType>
	ApiKey?: ApiKeyResolvers<ContextType>
	ApiKeyWithToken?: ApiKeyWithTokenResolvers<ContextType>
	ChangePasswordError?: ChangePasswordErrorResolvers<ContextType>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<ContextType>
	ConfirmOtpError?: ConfirmOtpErrorResolvers<ContextType>
	ConfirmOtpResponse?: ConfirmOtpResponseResolvers<ContextType>
	CreateApiKeyError?: CreateApiKeyErrorResolvers<ContextType>
	CreateApiKeyResponse?: CreateApiKeyResponseResolvers<ContextType>
	CreateApiKeyResult?: CreateApiKeyResultResolvers<ContextType>
	DisableApiKeyError?: DisableApiKeyErrorResolvers<ContextType>
	DisableApiKeyResponse?: DisableApiKeyResponseResolvers<ContextType>
	DisableOtpError?: DisableOtpErrorResolvers<ContextType>
	DisableOtpResponse?: DisableOtpResponseResolvers<ContextType>
	Identity?: IdentityResolvers<ContextType>
	IdentityProjectRelation?: IdentityProjectRelationResolvers<ContextType>
	InviteError?: InviteErrorResolvers<ContextType>
	InviteResponse?: InviteResponseResolvers<ContextType>
	InviteResult?: InviteResultResolvers<ContextType>
	Membership?: MembershipResolvers<ContextType>
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
	RoleDefinition?: RoleDefinitionResolvers<ContextType>
	RoleEntityVariableDefinition?: RoleEntityVariableDefinitionResolvers<ContextType>
	RoleVariableDefinition?: RoleVariableDefinitionResolvers
	SetupError?: SetupErrorResolvers<ContextType>
	SetupResponse?: SetupResponseResolvers<ContextType>
	SetupResult?: SetupResultResolvers<ContextType>
	SignInError?: SignInErrorResolvers<ContextType>
	SignInResponse?: SignInResponseResolvers<ContextType>
	SignInResult?: SignInResultResolvers<ContextType>
	SignOutError?: SignOutErrorResolvers<ContextType>
	SignOutResponse?: SignOutResponseResolvers<ContextType>
	SignUpError?: SignUpErrorResolvers<ContextType>
	SignUpResponse?: SignUpResponseResolvers<ContextType>
	SignUpResult?: SignUpResultResolvers<ContextType>
	UpdateProjectMemberError?: UpdateProjectMemberErrorResolvers<ContextType>
	UpdateProjectMemberResponse?: UpdateProjectMemberResponseResolvers<ContextType>
	VariableEntry?: VariableEntryResolvers<ContextType>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>

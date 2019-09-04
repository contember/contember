import { GraphQLResolveInfo } from 'graphql'
export type Maybe<T> = T | null
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type AddProjectMemberError = {
	__typename?: 'AddProjectMemberError'
	readonly code: AddProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum AddProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	IdentityNotFound = 'IDENTITY_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	AlreadyMember = 'ALREADY_MEMBER',
}

export type AddProjectMemberResponse = {
	__typename?: 'AddProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<AddProjectMemberError>
}

export type AdminCredentials = {
	readonly email: Scalars['String']
	readonly password: Scalars['String']
}

export type ApiKey = {
	__typename?: 'ApiKey'
	readonly id: Scalars['String']
	readonly token: Scalars['String']
	readonly identity: Identity
}

export type ApiKeyProjectInput = {
	readonly projectSlug: Scalars['String']
	readonly roles?: Maybe<ReadonlyArray<Scalars['String']>>
	readonly variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type ChangePasswordError = {
	__typename?: 'ChangePasswordError'
	readonly code: ChangePasswordErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum ChangePasswordErrorCode {
	PersonNotFound = 'PERSON_NOT_FOUND',
	TooWeak = 'TOO_WEAK',
}

export type ChangePasswordResponse = {
	__typename?: 'ChangePasswordResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ChangePasswordError>
}

export type CreateApiKeyError = {
	__typename?: 'CreateApiKeyError'
	readonly code: CreateApiKeyErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum CreateApiKeyErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
}

export type CreateApiKeyResponse = {
	__typename?: 'CreateApiKeyResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	__typename?: 'CreateApiKeyResult'
	readonly id: Scalars['String']
	readonly token: Scalars['String']
	readonly identity: IdentityWithoutPerson
}

export type DisableApiKeyError = {
	__typename?: 'DisableApiKeyError'
	readonly code: DisableApiKeyErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum DisableApiKeyErrorCode {
	KeyNotFound = 'KEY_NOT_FOUND',
}

export type DisableApiKeyResponse = {
	__typename?: 'DisableApiKeyResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<DisableApiKeyError>
}

export type Identity = {
	__typename?: 'Identity'
	readonly id: Scalars['String']
	readonly projects: ReadonlyArray<Project>
	readonly person?: Maybe<PersonWithoutIdentity>
}

export type IdentityWithoutPerson = {
	__typename?: 'IdentityWithoutPerson'
	readonly id: Scalars['String']
	readonly projects: ReadonlyArray<Project>
}

export type Mutation = {
	__typename?: 'Mutation'
	readonly setup?: Maybe<SetupResponse>
	readonly signUp?: Maybe<SignUpResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
	readonly disableApiKey?: Maybe<DisableApiKeyResponse>
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
}

export type MutationSignOutArgs = {
	all?: Maybe<Scalars['Boolean']>
}

export type MutationChangePasswordArgs = {
	personId: Scalars['String']
	password: Scalars['String']
}

export type MutationAddProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
	roles: ReadonlyArray<Scalars['String']>
	variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type MutationUpdateProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
	variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type MutationRemoveProjectMemberArgs = {
	projectSlug: Scalars['String']
	identityId: Scalars['String']
}

export type MutationCreateApiKeyArgs = {
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
	projects?: Maybe<ReadonlyArray<ApiKeyProjectInput>>
}

export type MutationDisableApiKeyArgs = {
	id: Scalars['String']
}

export type Person = {
	__typename?: 'Person'
	readonly id: Scalars['String']
	readonly email: Scalars['String']
	readonly identity: IdentityWithoutPerson
}

export type PersonWithoutIdentity = {
	__typename?: 'PersonWithoutIdentity'
	readonly id: Scalars['String']
	readonly email: Scalars['String']
}

export type Project = {
	__typename?: 'Project'
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
	readonly roles: ReadonlyArray<Scalars['String']>
}

export type Query = {
	__typename?: 'Query'
	readonly me: Identity
}

export type RemoveProjectMemberError = {
	__typename?: 'RemoveProjectMemberError'
	readonly code: RemoveProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum RemoveProjectMemberErrorCode {
	NotMember = 'NOT_MEMBER',
	ProjectNotFound = 'PROJECT_NOT_FOUND',
}

export type RemoveProjectMemberResponse = {
	__typename?: 'RemoveProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
}

export type SetupError = {
	__typename?: 'SetupError'
	readonly code: SetupErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SetupErrorCode {
	SetupAlreadyDone = 'SETUP_ALREADY_DONE',
}

export type SetupResponse = {
	__typename?: 'SetupResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SetupErrorCode>
	readonly result?: Maybe<SetupResult>
}

export type SetupResult = {
	__typename?: 'SetupResult'
	readonly superadmin: Person
	readonly loginKey: ApiKey
}

export type SignInError = {
	__typename?: 'SignInError'
	readonly code: SignInErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignInErrorCode {
	UnknownEmail = 'UNKNOWN_EMAIL',
	InvalidPassword = 'INVALID_PASSWORD',
}

export type SignInResponse = {
	__typename?: 'SignInResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignInError>
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = {
	__typename?: 'SignInResult'
	readonly token: Scalars['String']
	readonly person: Person
}

export type SignOutError = {
	__typename?: 'SignOutError'
	readonly code: SignOutErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignOutErrorCode {
	NotAPerson = 'NOT_A_PERSON',
}

export type SignOutResponse = {
	__typename?: 'SignOutResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignOutError>
}

export type SignUpError = {
	__typename?: 'SignUpError'
	readonly code: SignUpErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignUpErrorCode {
	EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
	TooWeak = 'TOO_WEAK',
}

export type SignUpResponse = {
	__typename?: 'SignUpResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignUpError>
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	__typename?: 'SignUpResult'
	readonly person: Person
}

export type UpdateProjectMemberError = {
	__typename?: 'UpdateProjectMemberError'
	readonly code: UpdateProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum UpdateProjectMemberErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	NotMember = 'NOT_MEMBER',
}

export type UpdateProjectMemberResponse = {
	__typename?: 'UpdateProjectMemberResponse'
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
}

export type VariableUpdate = {
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
	fragment: string
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| StitchingResolver<TResult, TParent, TContext, TArgs>

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

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ((...args: any[]) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
	| SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo,
) => Maybe<TTypes>

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
	Project: ResolverTypeWrapper<Project>
	PersonWithoutIdentity: ResolverTypeWrapper<PersonWithoutIdentity>
	Mutation: ResolverTypeWrapper<{}>
	AdminCredentials: AdminCredentials
	SetupResponse: ResolverTypeWrapper<SetupResponse>
	Boolean: ResolverTypeWrapper<Scalars['Boolean']>
	SetupErrorCode: SetupErrorCode
	SetupResult: ResolverTypeWrapper<SetupResult>
	Person: ResolverTypeWrapper<Person>
	IdentityWithoutPerson: ResolverTypeWrapper<IdentityWithoutPerson>
	ApiKey: ResolverTypeWrapper<ApiKey>
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
	VariableUpdate: VariableUpdate
	AddProjectMemberResponse: ResolverTypeWrapper<AddProjectMemberResponse>
	AddProjectMemberError: ResolverTypeWrapper<AddProjectMemberError>
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	UpdateProjectMemberResponse: ResolverTypeWrapper<UpdateProjectMemberResponse>
	UpdateProjectMemberError: ResolverTypeWrapper<UpdateProjectMemberError>
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	RemoveProjectMemberResponse: ResolverTypeWrapper<RemoveProjectMemberResponse>
	RemoveProjectMemberError: ResolverTypeWrapper<RemoveProjectMemberError>
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	ApiKeyProjectInput: ApiKeyProjectInput
	CreateApiKeyResponse: ResolverTypeWrapper<CreateApiKeyResponse>
	CreateApiKeyError: ResolverTypeWrapper<CreateApiKeyError>
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResult: ResolverTypeWrapper<CreateApiKeyResult>
	DisableApiKeyResponse: ResolverTypeWrapper<DisableApiKeyResponse>
	DisableApiKeyError: ResolverTypeWrapper<DisableApiKeyError>
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	SetupError: ResolverTypeWrapper<SetupError>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Query: {}
	Identity: Identity
	String: Scalars['String']
	Project: Project
	PersonWithoutIdentity: PersonWithoutIdentity
	Mutation: {}
	AdminCredentials: AdminCredentials
	SetupResponse: SetupResponse
	Boolean: Scalars['Boolean']
	SetupErrorCode: SetupErrorCode
	SetupResult: SetupResult
	Person: Person
	IdentityWithoutPerson: IdentityWithoutPerson
	ApiKey: ApiKey
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
	VariableUpdate: VariableUpdate
	AddProjectMemberResponse: AddProjectMemberResponse
	AddProjectMemberError: AddProjectMemberError
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	UpdateProjectMemberResponse: UpdateProjectMemberResponse
	UpdateProjectMemberError: UpdateProjectMemberError
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	RemoveProjectMemberResponse: RemoveProjectMemberResponse
	RemoveProjectMemberError: RemoveProjectMemberError
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	ApiKeyProjectInput: ApiKeyProjectInput
	CreateApiKeyResponse: CreateApiKeyResponse
	CreateApiKeyError: CreateApiKeyError
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyResult: CreateApiKeyResult
	DisableApiKeyResponse: DisableApiKeyResponse
	DisableApiKeyError: DisableApiKeyError
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	SetupError: SetupError
}

export type AddProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberError'] = ResolversParentTypes['AddProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['AddProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type AddProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberResponse'] = ResolversParentTypes['AddProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
}

export type ApiKeyResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
}

export type ChangePasswordErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordError'] = ResolversParentTypes['ChangePasswordError']
> = {
	code?: Resolver<ResolversTypes['ChangePasswordErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type ChangePasswordResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordResponse'] = ResolversParentTypes['ChangePasswordResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
}

export type CreateApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyError'] = ResolversParentTypes['CreateApiKeyError']
> = {
	code?: Resolver<ResolversTypes['CreateApiKeyErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type CreateApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResponse'] = ResolversParentTypes['CreateApiKeyResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateApiKeyResult']>, ParentType, ContextType>
}

export type CreateApiKeyResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResult'] = ResolversParentTypes['CreateApiKeyResult']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['IdentityWithoutPerson'], ParentType, ContextType>
}

export type DisableApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyError'] = ResolversParentTypes['DisableApiKeyError']
> = {
	code?: Resolver<ResolversTypes['DisableApiKeyErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type DisableApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyResponse'] = ResolversParentTypes['DisableApiKeyResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
}

export type IdentityResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
	person?: Resolver<Maybe<ResolversTypes['PersonWithoutIdentity']>, ParentType, ContextType>
}

export type IdentityWithoutPersonResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityWithoutPerson'] = ResolversParentTypes['IdentityWithoutPerson']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
}

export type MutationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
	setup?: Resolver<Maybe<ResolversTypes['SetupResponse']>, ParentType, ContextType, MutationSetupArgs>
	signUp?: Resolver<Maybe<ResolversTypes['SignUpResponse']>, ParentType, ContextType, MutationSignUpArgs>
	signIn?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, MutationSignInArgs>
	signOut?: Resolver<Maybe<ResolversTypes['SignOutResponse']>, ParentType, ContextType, MutationSignOutArgs>
	changePassword?: Resolver<
		Maybe<ResolversTypes['ChangePasswordResponse']>,
		ParentType,
		ContextType,
		MutationChangePasswordArgs
	>
	addProjectMember?: Resolver<
		Maybe<ResolversTypes['AddProjectMemberResponse']>,
		ParentType,
		ContextType,
		MutationAddProjectMemberArgs
	>
	updateProjectMember?: Resolver<
		Maybe<ResolversTypes['UpdateProjectMemberResponse']>,
		ParentType,
		ContextType,
		MutationUpdateProjectMemberArgs
	>
	removeProjectMember?: Resolver<
		Maybe<ResolversTypes['RemoveProjectMemberResponse']>,
		ParentType,
		ContextType,
		MutationRemoveProjectMemberArgs
	>
	createApiKey?: Resolver<
		Maybe<ResolversTypes['CreateApiKeyResponse']>,
		ParentType,
		ContextType,
		MutationCreateApiKeyArgs
	>
	disableApiKey?: Resolver<
		Maybe<ResolversTypes['DisableApiKeyResponse']>,
		ParentType,
		ContextType,
		MutationDisableApiKeyArgs
	>
}

export type PersonResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['IdentityWithoutPerson'], ParentType, ContextType>
}

export type PersonWithoutIdentityResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PersonWithoutIdentity'] = ResolversParentTypes['PersonWithoutIdentity']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	email?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ProjectResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
	me?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
}

export type RemoveProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberError'] = ResolversParentTypes['RemoveProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['RemoveProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type RemoveProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberResponse'] = ResolversParentTypes['RemoveProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
}

export type SetupErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupError'] = ResolversParentTypes['SetupError']
> = {
	code?: Resolver<ResolversTypes['SetupErrorCode'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type SetupResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupResponse'] = ResolversParentTypes['SetupResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SetupErrorCode']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SetupResult']>, ParentType, ContextType>
}

export type SetupResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetupResult'] = ResolversParentTypes['SetupResult']
> = {
	superadmin?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	loginKey?: Resolver<ResolversTypes['ApiKey'], ParentType, ContextType>
}

export type SignInErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInError'] = ResolversParentTypes['SignInError']
> = {
	code?: Resolver<ResolversTypes['SignInErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type SignInResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInResult']>, ParentType, ContextType>
}

export type SignInResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']
> = {
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
}

export type SignOutErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignOutError'] = ResolversParentTypes['SignOutError']
> = {
	code?: Resolver<ResolversTypes['SignOutErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type SignOutResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignOutResponse'] = ResolversParentTypes['SignOutResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignOutError']>, ParentType, ContextType>
}

export type SignUpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpError'] = ResolversParentTypes['SignUpError']
> = {
	code?: Resolver<ResolversTypes['SignUpErrorCode'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type SignUpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignUpError']>, ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignUpResult']>, ParentType, ContextType>
}

export type SignUpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpResult'] = ResolversParentTypes['SignUpResult']
> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
}

export type UpdateProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberError'] = ResolversParentTypes['UpdateProjectMemberError']
> = {
	code?: Resolver<ResolversTypes['UpdateProjectMemberErrorCode'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	developerMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type UpdateProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberResponse'] = ResolversParentTypes['UpdateProjectMemberResponse']
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	AddProjectMemberError?: AddProjectMemberErrorResolvers<ContextType>
	AddProjectMemberResponse?: AddProjectMemberResponseResolvers<ContextType>
	ApiKey?: ApiKeyResolvers<ContextType>
	ChangePasswordError?: ChangePasswordErrorResolvers<ContextType>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<ContextType>
	CreateApiKeyError?: CreateApiKeyErrorResolvers<ContextType>
	CreateApiKeyResponse?: CreateApiKeyResponseResolvers<ContextType>
	CreateApiKeyResult?: CreateApiKeyResultResolvers<ContextType>
	DisableApiKeyError?: DisableApiKeyErrorResolvers<ContextType>
	DisableApiKeyResponse?: DisableApiKeyResponseResolvers<ContextType>
	Identity?: IdentityResolvers<ContextType>
	IdentityWithoutPerson?: IdentityWithoutPersonResolvers<ContextType>
	Mutation?: MutationResolvers<ContextType>
	Person?: PersonResolvers<ContextType>
	PersonWithoutIdentity?: PersonWithoutIdentityResolvers<ContextType>
	Project?: ProjectResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RemoveProjectMemberError?: RemoveProjectMemberErrorResolvers<ContextType>
	RemoveProjectMemberResponse?: RemoveProjectMemberResponseResolvers<ContextType>
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
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>

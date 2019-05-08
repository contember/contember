type Maybe<T> = T | null
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export type AddProjectMemberError = {
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
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<AddProjectMemberError>
}

export type AdminCredentials = {
	readonly email: Scalars['String']
	readonly password: Scalars['String']
}

export type ApiKey = {
	readonly id: Scalars['String']
	readonly token: Scalars['String']
	readonly identity: Identity
}

export type ApiKeyProjectInput = {
	readonly projectId: Scalars['String']
	readonly roles?: Maybe<ReadonlyArray<Scalars['String']>>
	readonly variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type ChangePasswordError = {
	readonly code: ChangePasswordErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum ChangePasswordErrorCode {
	PersonNotFound = 'PERSON_NOT_FOUND',
	TooWeak = 'TOO_WEAK',
}

export type ChangePasswordResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<ChangePasswordError>
}

export type CreateApiKeyError = {
	readonly code: CreateApiKeyErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum CreateApiKeyErrorCode {
	ProjectNotFound = 'PROJECT_NOT_FOUND',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
}

export type CreateApiKeyResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	readonly id: Scalars['String']
	readonly token: Scalars['String']
	readonly identity: IdentityWithoutPerson
}

export type Identity = {
	readonly id: Scalars['String']
	readonly projects: ReadonlyArray<Project>
	readonly person?: Maybe<PersonWithoutIdentity>
}

export type IdentityWithoutPerson = {
	readonly id: Scalars['String']
	readonly projects: ReadonlyArray<Project>
}

export type Mutation = {
	readonly setup?: Maybe<SetupResponse>
	readonly signUp?: Maybe<SignUpResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
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
	projectId: Scalars['String']
	identityId: Scalars['String']
	roles: ReadonlyArray<Scalars['String']>
	variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type MutationUpdateProjectMemberArgs = {
	projectId: Scalars['String']
	identityId: Scalars['String']
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
	variables?: Maybe<ReadonlyArray<VariableUpdate>>
}

export type MutationRemoveProjectMemberArgs = {
	projectId: Scalars['String']
	identityId: Scalars['String']
}

export type MutationCreateApiKeyArgs = {
	roles?: Maybe<ReadonlyArray<Scalars['String']>>
	projects?: Maybe<ReadonlyArray<ApiKeyProjectInput>>
}

export type Person = {
	readonly id: Scalars['String']
	readonly email: Scalars['String']
	readonly identity: IdentityWithoutPerson
}

export type PersonWithoutIdentity = {
	readonly id: Scalars['String']
	readonly email: Scalars['String']
}

export type Project = {
	readonly id: Scalars['String']
	readonly name: Scalars['String']
	readonly slug: Scalars['String']
}

export type Query = {
	readonly me: Identity
}

export type RemoveProjectMemberError = {
	readonly code: RemoveProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum RemoveProjectMemberErrorCode {
	NotMember = 'NOT_MEMBER',
}

export type RemoveProjectMemberResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
}

export type SetupError = {
	readonly code: SetupErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SetupErrorCode {
	SetupAlreadyDone = 'SETUP_ALREADY_DONE',
}

export type SetupResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SetupErrorCode>
	readonly result?: Maybe<SetupResult>
}

export type SetupResult = {
	readonly superadmin: Person
	readonly loginKey: ApiKey
}

export type SignInError = {
	readonly code: SignInErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignInErrorCode {
	UnknownEmail = 'UNKNOWN_EMAIL',
	InvalidPassword = 'INVALID_PASSWORD',
}

export type SignInResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignInError>
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = {
	readonly token: Scalars['String']
	readonly person: Person
}

export type SignOutError = {
	readonly code: SignOutErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignOutErrorCode {
	NotAPerson = 'NOT_A_PERSON',
}

export type SignOutResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignOutError>
}

export type SignUpError = {
	readonly code: SignUpErrorCode
	readonly endPersonMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum SignUpErrorCode {
	EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
	TooWeak = 'TOO_WEAK',
}

export type SignUpResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<SignUpError>
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	readonly person: Person
}

export type UpdateProjectMemberError = {
	readonly code: UpdateProjectMemberErrorCode
	readonly endUserMessage?: Maybe<Scalars['String']>
	readonly developerMessage?: Maybe<Scalars['String']>
}

export enum UpdateProjectMemberErrorCode {
	VariableNotFound = 'VARIABLE_NOT_FOUND',
	NotMember = 'NOT_MEMBER',
}

export type UpdateProjectMemberResponse = {
	readonly ok: Scalars['Boolean']
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
}

export type VariableUpdate = {
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

import { GraphQLResolveInfo } from 'graphql'

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
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
	info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
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
	info: GraphQLResolveInfo
) => Maybe<TTypes>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export type AddProjectMemberErrorResolvers<Context = any, ParentType = AddProjectMemberError> = {
	code?: Resolver<AddProjectMemberErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type AddProjectMemberResponseResolvers<Context = any, ParentType = AddProjectMemberResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<AddProjectMemberError>, ParentType, Context>
}

export type ApiKeyResolvers<Context = any, ParentType = ApiKey> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	token?: Resolver<Scalars['String'], ParentType, Context>
	identity?: Resolver<Identity, ParentType, Context>
}

export type ChangePasswordErrorResolvers<Context = any, ParentType = ChangePasswordError> = {
	code?: Resolver<ChangePasswordErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type ChangePasswordResponseResolvers<Context = any, ParentType = ChangePasswordResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<ChangePasswordError>, ParentType, Context>
}

export type CreateApiKeyErrorResolvers<Context = any, ParentType = CreateApiKeyError> = {
	code?: Resolver<CreateApiKeyErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type CreateApiKeyResponseResolvers<Context = any, ParentType = CreateApiKeyResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<CreateApiKeyError>, ParentType, Context>
	result?: Resolver<Maybe<CreateApiKeyResult>, ParentType, Context>
}

export type CreateApiKeyResultResolvers<Context = any, ParentType = CreateApiKeyResult> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	token?: Resolver<Scalars['String'], ParentType, Context>
	identity?: Resolver<IdentityWithoutPerson, ParentType, Context>
}

export type IdentityResolvers<Context = any, ParentType = Identity> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	projects?: Resolver<ReadonlyArray<Project>, ParentType, Context>
	person?: Resolver<Maybe<PersonWithoutIdentity>, ParentType, Context>
}

export type IdentityWithoutPersonResolvers<Context = any, ParentType = IdentityWithoutPerson> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	projects?: Resolver<ReadonlyArray<Project>, ParentType, Context>
}

export type MutationResolvers<Context = any, ParentType = Mutation> = {
	setup?: Resolver<Maybe<SetupResponse>, ParentType, Context, MutationSetupArgs>
	signUp?: Resolver<Maybe<SignUpResponse>, ParentType, Context, MutationSignUpArgs>
	signIn?: Resolver<Maybe<SignInResponse>, ParentType, Context, MutationSignInArgs>
	signOut?: Resolver<Maybe<SignOutResponse>, ParentType, Context, MutationSignOutArgs>
	changePassword?: Resolver<Maybe<ChangePasswordResponse>, ParentType, Context, MutationChangePasswordArgs>
	addProjectMember?: Resolver<Maybe<AddProjectMemberResponse>, ParentType, Context, MutationAddProjectMemberArgs>
	updateProjectMember?: Resolver<
		Maybe<UpdateProjectMemberResponse>,
		ParentType,
		Context,
		MutationUpdateProjectMemberArgs
	>
	removeProjectMember?: Resolver<
		Maybe<RemoveProjectMemberResponse>,
		ParentType,
		Context,
		MutationRemoveProjectMemberArgs
	>
	createApiKey?: Resolver<Maybe<CreateApiKeyResponse>, ParentType, Context, MutationCreateApiKeyArgs>
}

export type PersonResolvers<Context = any, ParentType = Person> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	email?: Resolver<Scalars['String'], ParentType, Context>
	identity?: Resolver<IdentityWithoutPerson, ParentType, Context>
}

export type PersonWithoutIdentityResolvers<Context = any, ParentType = PersonWithoutIdentity> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	email?: Resolver<Scalars['String'], ParentType, Context>
}

export type ProjectResolvers<Context = any, ParentType = Project> = {
	id?: Resolver<Scalars['String'], ParentType, Context>
	name?: Resolver<Scalars['String'], ParentType, Context>
	slug?: Resolver<Scalars['String'], ParentType, Context>
}

export type QueryResolvers<Context = any, ParentType = Query> = {
	me?: Resolver<Identity, ParentType, Context>
}

export type RemoveProjectMemberErrorResolvers<Context = any, ParentType = RemoveProjectMemberError> = {
	code?: Resolver<RemoveProjectMemberErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type RemoveProjectMemberResponseResolvers<Context = any, ParentType = RemoveProjectMemberResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<RemoveProjectMemberError>, ParentType, Context>
}

export type SetupErrorResolvers<Context = any, ParentType = SetupError> = {
	code?: Resolver<SetupErrorCode, ParentType, Context>
	endPersonMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type SetupResponseResolvers<Context = any, ParentType = SetupResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<SetupErrorCode>, ParentType, Context>
	result?: Resolver<Maybe<SetupResult>, ParentType, Context>
}

export type SetupResultResolvers<Context = any, ParentType = SetupResult> = {
	superadmin?: Resolver<Person, ParentType, Context>
	loginKey?: Resolver<ApiKey, ParentType, Context>
}

export type SignInErrorResolvers<Context = any, ParentType = SignInError> = {
	code?: Resolver<SignInErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type SignInResponseResolvers<Context = any, ParentType = SignInResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<SignInError>, ParentType, Context>
	result?: Resolver<Maybe<SignInResult>, ParentType, Context>
}

export type SignInResultResolvers<Context = any, ParentType = SignInResult> = {
	token?: Resolver<Scalars['String'], ParentType, Context>
	person?: Resolver<Person, ParentType, Context>
}

export type SignOutErrorResolvers<Context = any, ParentType = SignOutError> = {
	code?: Resolver<SignOutErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type SignOutResponseResolvers<Context = any, ParentType = SignOutResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<SignOutError>, ParentType, Context>
}

export type SignUpErrorResolvers<Context = any, ParentType = SignUpError> = {
	code?: Resolver<SignUpErrorCode, ParentType, Context>
	endPersonMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type SignUpResponseResolvers<Context = any, ParentType = SignUpResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<SignUpError>, ParentType, Context>
	result?: Resolver<Maybe<SignUpResult>, ParentType, Context>
}

export type SignUpResultResolvers<Context = any, ParentType = SignUpResult> = {
	person?: Resolver<Person, ParentType, Context>
}

export type UpdateProjectMemberErrorResolvers<Context = any, ParentType = UpdateProjectMemberError> = {
	code?: Resolver<UpdateProjectMemberErrorCode, ParentType, Context>
	endUserMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
	developerMessage?: Resolver<Maybe<Scalars['String']>, ParentType, Context>
}

export type UpdateProjectMemberResponseResolvers<Context = any, ParentType = UpdateProjectMemberResponse> = {
	ok?: Resolver<Scalars['Boolean'], ParentType, Context>
	errors?: Resolver<ReadonlyArray<UpdateProjectMemberError>, ParentType, Context>
}

export type Resolvers<Context = any> = {
	AddProjectMemberError?: AddProjectMemberErrorResolvers<Context>
	AddProjectMemberResponse?: AddProjectMemberResponseResolvers<Context>
	ApiKey?: ApiKeyResolvers<Context>
	ChangePasswordError?: ChangePasswordErrorResolvers<Context>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<Context>
	CreateApiKeyError?: CreateApiKeyErrorResolvers<Context>
	CreateApiKeyResponse?: CreateApiKeyResponseResolvers<Context>
	CreateApiKeyResult?: CreateApiKeyResultResolvers<Context>
	Identity?: IdentityResolvers<Context>
	IdentityWithoutPerson?: IdentityWithoutPersonResolvers<Context>
	Mutation?: MutationResolvers<Context>
	Person?: PersonResolvers<Context>
	PersonWithoutIdentity?: PersonWithoutIdentityResolvers<Context>
	Project?: ProjectResolvers<Context>
	Query?: QueryResolvers<Context>
	RemoveProjectMemberError?: RemoveProjectMemberErrorResolvers<Context>
	RemoveProjectMemberResponse?: RemoveProjectMemberResponseResolvers<Context>
	SetupError?: SetupErrorResolvers<Context>
	SetupResponse?: SetupResponseResolvers<Context>
	SetupResult?: SetupResultResolvers<Context>
	SignInError?: SignInErrorResolvers<Context>
	SignInResponse?: SignInResponseResolvers<Context>
	SignInResult?: SignInResultResolvers<Context>
	SignOutError?: SignOutErrorResolvers<Context>
	SignOutResponse?: SignOutResponseResolvers<Context>
	SignUpError?: SignUpErrorResolvers<Context>
	SignUpResponse?: SignUpResponseResolvers<Context>
	SignUpResult?: SignUpResultResolvers<Context>
	UpdateProjectMemberError?: UpdateProjectMemberErrorResolvers<Context>
	UpdateProjectMemberResponse?: UpdateProjectMemberResponseResolvers<Context>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<Context = any> = Resolvers<Context>

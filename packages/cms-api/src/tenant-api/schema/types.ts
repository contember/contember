/* tslint:disable */
import { GraphQLResolveInfo } from 'graphql'

export type Resolver<Result, Args = any> = (
	parent: any,
	args: Args,
	context: any,
	info: GraphQLResolveInfo
) => Promise<Result> | Result

export interface Query {
	readonly me: Identity
}

export interface Identity {
	readonly id: string
	readonly projects: ReadonlyArray<Project>
	readonly person?: PersonWithoutIdentity | null
}

export interface Project {
	readonly id: string
	readonly name: string
	readonly slug: string
}

export interface PersonWithoutIdentity {
	readonly id: string
	readonly email: string
}

export interface Mutation {
	readonly setup?: SetupResponse | null
	readonly signUp?: SignUpResponse | null
	readonly signIn?: SignInResponse | null
	readonly addProjectMember?: AddProjectMemberResponse | null
	readonly updateProjectMemberVariables?: UpdateProjectMemberVariablesResponse | null
}

export interface SetupResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<SetupErrorCode>
	readonly result?: SetupResult | null
}

export interface SetupResult {
	readonly superadmin: Person
	readonly loginKey: ApiKey
}

export interface Person {
	readonly id: string
	readonly email: string
	readonly identity: IdentityWithoutPerson
}

export interface IdentityWithoutPerson {
	readonly id: string
	readonly projects: ReadonlyArray<Project>
}

export interface ApiKey {
	readonly id: string
	readonly token: string
	readonly identity: Identity
}

export interface SignUpResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<SignUpError>
	readonly result?: SignUpResult | null
}

export interface SignUpError {
	readonly code: SignUpErrorCode
	readonly endPersonMessage?: string | null
	readonly developerMessage?: string | null
}

export interface SignUpResult {
	readonly person: Person
}

export interface SignInResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<SignInError>
	readonly result?: SignInResult | null
}

export interface SignInError {
	readonly code: SignInErrorCode
	readonly endUserMessage?: string | null
	readonly developerMessage?: string | null
}

export interface SignInResult {
	readonly token: string
	readonly person: Person
}

export interface AddProjectMemberResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<AddProjectMemberError>
}

export interface AddProjectMemberError {
	readonly code: AddProjectMemberErrorCode
	readonly endUserMessage?: string | null
	readonly developerMessage?: string | null
}

export interface UpdateProjectMemberVariablesResponse {
	readonly ok: boolean
	readonly errors: ReadonlyArray<UpdateProjectMemberVariablesError>
}

export interface UpdateProjectMemberVariablesError {
	readonly code: UpdateProjectMemberVariablesErrorCode
	readonly endUserMessage?: string | null
	readonly developerMessage?: string | null
}

export interface SetupError {
	readonly code: SetupErrorCode
	readonly endPersonMessage?: string | null
	readonly developerMessage?: string | null
}

export interface AdminCredentials {
	readonly email: string
	readonly password: string
}

export interface VariableUpdate {
	readonly name: string
	readonly values: ReadonlyArray<string>
}
export interface SetupMutationArgs {
	superadmin: AdminCredentials
}
export interface SignUpMutationArgs {
	email: string
	password: string
}
export interface SignInMutationArgs {
	email: string
	password: string
	expiration?: number | null
}
export interface AddProjectMemberMutationArgs {
	projectId: string
	identityId: string
	roles: ReadonlyArray<string>
}
export interface UpdateProjectMemberVariablesMutationArgs {
	projectId: string
	identityId: string
	variables: ReadonlyArray<VariableUpdate>
}

export enum SetupErrorCode {
	SETUP_ALREADY_DONE = 'SETUP_ALREADY_DONE',
}

export enum SignUpErrorCode {
	EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
}

export enum SignInErrorCode {
	UNKNOWN_EMAIL = 'UNKNOWN_EMAIL',
	INVALID_PASSWORD = 'INVALID_PASSWORD',
}

export enum AddProjectMemberErrorCode {
	PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
	IDENTITY_NOT_FOUND = 'IDENTITY_NOT_FOUND',
	ALREADY_MEMBER = 'ALREADY_MEMBER',
}

export enum UpdateProjectMemberVariablesErrorCode {
	PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
	IDENTITY_NOT_FOUND = 'IDENTITY_NOT_FOUND',
	VARIABLE_NOT_FOUND = 'VARIABLE_NOT_FOUND',
}

export namespace QueryResolvers {
	export interface Resolvers {
		me?: MeResolver
	}

	export type MeResolver<R = Identity> = Resolver<R>
}

export namespace IdentityResolvers {
	export interface Resolvers {
		id?: IdResolver
		projects?: ProjectsResolver
		person?: PersonResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type ProjectsResolver<R = ReadonlyArray<Project>> = Resolver<R>
	export type PersonResolver<R = PersonWithoutIdentity | null> = Resolver<R>
}

export namespace ProjectResolvers {
	export interface Resolvers {
		id?: IdResolver
		name?: NameResolver
		slug?: SlugResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type NameResolver<R = string> = Resolver<R>
	export type SlugResolver<R = string> = Resolver<R>
}

export namespace PersonWithoutIdentityResolvers {
	export interface Resolvers {
		id?: IdResolver
		email?: EmailResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type EmailResolver<R = string> = Resolver<R>
}

export namespace MutationResolvers {
	export interface Resolvers {
		setup?: SetupResolver
		signUp?: SignUpResolver
		signIn?: SignInResolver
		addProjectMember?: AddProjectMemberResolver
		updateProjectMemberVariables?: UpdateProjectMemberVariablesResolver
	}

	export type SetupResolver<R = SetupResponse | null> = Resolver<R, SetupArgs>
	export interface SetupArgs {
		superadmin: AdminCredentials
	}

	export type SignUpResolver<R = SignUpResponse | null> = Resolver<R, SignUpArgs>
	export interface SignUpArgs {
		email: string
		password: string
	}

	export type SignInResolver<R = SignInResponse | null> = Resolver<R, SignInArgs>
	export interface SignInArgs {
		email: string
		password: string
		expiration?: number | null
	}

	export type AddProjectMemberResolver<R = AddProjectMemberResponse | null> = Resolver<R, AddProjectMemberArgs>
	export interface AddProjectMemberArgs {
		projectId: string
		identityId: string
		roles: ReadonlyArray<string>
	}

	export type UpdateProjectMemberVariablesResolver<R = UpdateProjectMemberVariablesResponse | null> = Resolver<
		R,
		UpdateProjectMemberVariablesArgs
	>
	export interface UpdateProjectMemberVariablesArgs {
		projectId: string
		identityId: string
		variables: ReadonlyArray<VariableUpdate>
	}
}

export namespace SetupResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
		result?: ResultResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<SetupErrorCode>> = Resolver<R>
	export type ResultResolver<R = SetupResult | null> = Resolver<R>
}

export namespace SetupResultResolvers {
	export interface Resolvers {
		superadmin?: SuperadminResolver
		loginKey?: LoginKeyResolver
	}

	export type SuperadminResolver<R = Person> = Resolver<R>
	export type LoginKeyResolver<R = ApiKey> = Resolver<R>
}

export namespace PersonResolvers {
	export interface Resolvers {
		id?: IdResolver
		email?: EmailResolver
		identity?: IdentityResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type EmailResolver<R = string> = Resolver<R>
	export type IdentityResolver<R = IdentityWithoutPerson> = Resolver<R>
}

export namespace IdentityWithoutPersonResolvers {
	export interface Resolvers {
		id?: IdResolver
		projects?: ProjectsResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type ProjectsResolver<R = ReadonlyArray<Project>> = Resolver<R>
}

export namespace ApiKeyResolvers {
	export interface Resolvers {
		id?: IdResolver
		token?: TokenResolver
		identity?: IdentityResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type TokenResolver<R = string> = Resolver<R>
	export type IdentityResolver<R = Identity> = Resolver<R>
}

export namespace SignUpResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
		result?: ResultResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<SignUpError>> = Resolver<R>
	export type ResultResolver<R = SignUpResult | null> = Resolver<R>
}

export namespace SignUpErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver
		endPersonMessage?: EndPersonMessageResolver
		developerMessage?: DeveloperMessageResolver
	}

	export type CodeResolver<R = SignUpErrorCode> = Resolver<R>
	export type EndPersonMessageResolver<R = string | null> = Resolver<R>
	export type DeveloperMessageResolver<R = string | null> = Resolver<R>
}

export namespace SignUpResultResolvers {
	export interface Resolvers {
		person?: PersonResolver
	}

	export type PersonResolver<R = Person> = Resolver<R>
}

export namespace SignInResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
		result?: ResultResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<SignInError>> = Resolver<R>
	export type ResultResolver<R = SignInResult | null> = Resolver<R>
}

export namespace SignInErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver
		endUserMessage?: EndUserMessageResolver
		developerMessage?: DeveloperMessageResolver
	}

	export type CodeResolver<R = SignInErrorCode> = Resolver<R>
	export type EndUserMessageResolver<R = string | null> = Resolver<R>
	export type DeveloperMessageResolver<R = string | null> = Resolver<R>
}

export namespace SignInResultResolvers {
	export interface Resolvers {
		token?: TokenResolver
		person?: PersonResolver
	}

	export type TokenResolver<R = string> = Resolver<R>
	export type PersonResolver<R = Person> = Resolver<R>
}

export namespace AddProjectMemberResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<AddProjectMemberError>> = Resolver<R>
}

export namespace AddProjectMemberErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver
		endUserMessage?: EndUserMessageResolver
		developerMessage?: DeveloperMessageResolver
	}

	export type CodeResolver<R = AddProjectMemberErrorCode> = Resolver<R>
	export type EndUserMessageResolver<R = string | null> = Resolver<R>
	export type DeveloperMessageResolver<R = string | null> = Resolver<R>
}

export namespace UpdateProjectMemberVariablesResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver
		errors?: ErrorsResolver
	}

	export type OkResolver<R = boolean> = Resolver<R>
	export type ErrorsResolver<R = ReadonlyArray<UpdateProjectMemberVariablesError>> = Resolver<R>
}

export namespace UpdateProjectMemberVariablesErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver
		endUserMessage?: EndUserMessageResolver
		developerMessage?: DeveloperMessageResolver
	}

	export type CodeResolver<R = UpdateProjectMemberVariablesErrorCode> = Resolver<R>
	export type EndUserMessageResolver<R = string | null> = Resolver<R>
	export type DeveloperMessageResolver<R = string | null> = Resolver<R>
}

export namespace SetupErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver
		endPersonMessage?: EndPersonMessageResolver
		developerMessage?: DeveloperMessageResolver
	}

	export type CodeResolver<R = SetupErrorCode> = Resolver<R>
	export type EndPersonMessageResolver<R = string | null> = Resolver<R>
	export type DeveloperMessageResolver<R = string | null> = Resolver<R>
}

/* tslint:disable */
import { GraphQLResolveInfo } from 'graphql'

export type Resolver<Result, Args = any> = (
	parent: any,
	args: Args,
	context: any,
	info: GraphQLResolveInfo
) => Promise<Result> | Result

export interface Query {
	readonly me: Person
}

export interface Person {
	readonly id: string
	readonly email: string
	readonly projects: ReadonlyArray<Project>
}

export interface Project {
	readonly id: string
	readonly name: string
}

export interface Mutation {
	readonly signUp?: SignUpResponse | null
	readonly signIn?: SignInResponse | null
	readonly addProjectMember?: AddProjectMemberResponse | null
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
export interface SignUpMutationArgs {
	email: string
	password: string
}
export interface SignInMutationArgs {
	email: string
	password: string
}
export interface AddProjectMemberMutationArgs {
	projectId: string
	personId: string
}

export enum SignUpErrorCode {
	EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS'
}

export enum SignInErrorCode {
	UNKNOWN_EMAIL = 'UNKNOWN_EMAIL',
	INVALID_PASSWORD = 'INVALID_PASSWORD'
}

export enum AddProjectMemberErrorCode {
	PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
	PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
	ALREADY_MEMBER = 'ALREADY_MEMBER'
}

export namespace QueryResolvers {
	export interface Resolvers {
		me?: MeResolver
	}

	export type MeResolver<R = Person> = Resolver<R>
}

export namespace PersonResolvers {
	export interface Resolvers {
		id?: IdResolver
		email?: EmailResolver
		projects?: ProjectsResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type EmailResolver<R = string> = Resolver<R>
	export type ProjectsResolver<R = ReadonlyArray<Project>> = Resolver<R>
}

export namespace ProjectResolvers {
	export interface Resolvers {
		id?: IdResolver
		name?: NameResolver
	}

	export type IdResolver<R = string> = Resolver<R>
	export type NameResolver<R = string> = Resolver<R>
}

export namespace MutationResolvers {
	export interface Resolvers {
		signUp?: SignUpResolver
		signIn?: SignInResolver
		addProjectMember?: AddProjectMemberResolver
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
	}

	export type AddProjectMemberResolver<R = AddProjectMemberResponse | null> = Resolver<R, AddProjectMemberArgs>
	export interface AddProjectMemberArgs {
		projectId: string
		personId: string
	}
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

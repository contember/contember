/* tslint:disable */
import { GraphQLResolveInfo } from "graphql";

type Resolver<Result, Args = any> = (
	parent: any,
	args: Args,
	context: any,
	info: GraphQLResolveInfo
) => Promise<Result> | Result;

export interface Query {
	readonly me: Person;
}

export interface Person {
	readonly id: string;
	readonly email: string;
	readonly projects: ReadonlyArray<Project>;
}

export interface Project {
	readonly id: string;
	readonly name: string;
}

export interface Mutation {
	readonly signUp?: SignUpResponse | null;
	readonly signIn?: SignInResponse | null;
	readonly addProjectMember?: AddProjectMemberResponse | null;
}

export interface SignUpResponse {
	readonly ok: boolean;
	readonly errors: ReadonlyArray<SignUpError>;
	readonly result?: SignUpResult | null;
}

export interface SignUpError {
	readonly code: SignUpErrorCode;
	readonly endPersonMessage?: string | null;
	readonly developerMessage?: string | null;
}

export interface SignUpResult {
	readonly person: Person;
}

export interface SignInResponse {
	readonly ok: boolean;
	readonly errors: ReadonlyArray<SignInError>;
	readonly result?: SignInResult | null;
}

export interface SignInError {
	readonly code: SignInErrorCode;
	readonly endUserMessage?: string | null;
	readonly developerMessage?: string | null;
}

export interface SignInResult {
	readonly token: string;
	readonly person: Person;
}

export interface AddProjectMemberResponse {
	readonly ok: boolean;
	readonly errors: ReadonlyArray<AddProjectMemberError>;
}

export interface AddProjectMemberError {
	readonly code: AddProjectMemberErrorCode;
	readonly endUserMessage?: string | null;
	readonly developerMessage?: string | null;
}
export interface SignUpMutationArgs {
	email: string;
	password: string;
}
export interface SignInMutationArgs {
	email: string;
	password: string;
}
export interface AddProjectMemberMutationArgs {
	projectId: string;
	personId: string;
}

export enum SignUpErrorCode {
	EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
}

export enum SignInErrorCode {
	UNKNOWN_EMAIL = "UNKNOWN_EMAIL",
	INVALID_PASSWORD = "INVALID_PASSWORD"
}

export enum AddProjectMemberErrorCode {
	PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
	PERSON_NOT_FOUND = "PERSON_NOT_FOUND",
	ALREADY_MEMBER = "ALREADY_MEMBER"
}

export namespace QueryResolvers {
	export interface Resolvers {
		me?: MeResolver;
	}

	export type MeResolver = Resolver<Person>;
}

export namespace PersonResolvers {
	export interface Resolvers {
		id?: IdResolver;
		email?: EmailResolver;
		projects?: ProjectsResolver;
	}

	export type IdResolver = Resolver<string>;
	export type EmailResolver = Resolver<string>;
	export type ProjectsResolver = Resolver<ReadonlyArray<Project>>;
}

export namespace ProjectResolvers {
	export interface Resolvers {
		id?: IdResolver;
		name?: NameResolver;
	}

	export type IdResolver = Resolver<string>;
	export type NameResolver = Resolver<string>;
}

export namespace MutationResolvers {
	export interface Resolvers {
		signUp?: SignUpResolver;
		signIn?: SignInResolver;
		addProjectMember?: AddProjectMemberResolver;
	}

	export type SignUpResolver = Resolver<SignUpResponse | null, SignUpArgs>;
	export interface SignUpArgs {
		email: string;
		password: string;
	}

	export type SignInResolver = Resolver<SignInResponse | null, SignInArgs>;
	export interface SignInArgs {
		email: string;
		password: string;
	}

	export type AddProjectMemberResolver = Resolver<
		AddProjectMemberResponse | null,
		AddProjectMemberArgs
	>;
	export interface AddProjectMemberArgs {
		projectId: string;
		personId: string;
	}
}

export namespace SignUpResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver;
		errors?: ErrorsResolver;
		result?: ResultResolver;
	}

	export type OkResolver = Resolver<boolean>;
	export type ErrorsResolver = Resolver<ReadonlyArray<SignUpError>>;
	export type ResultResolver = Resolver<SignUpResult | null>;
}

export namespace SignUpErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver;
		endPersonMessage?: EndPersonMessageResolver;
		developerMessage?: DeveloperMessageResolver;
	}

	export type CodeResolver = Resolver<SignUpErrorCode>;
	export type EndPersonMessageResolver = Resolver<string | null>;
	export type DeveloperMessageResolver = Resolver<string | null>;
}

export namespace SignUpResultResolvers {
	export interface Resolvers {
		person?: PersonResolver;
	}

	export type PersonResolver = Resolver<Person>;
}

export namespace SignInResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver;
		errors?: ErrorsResolver;
		result?: ResultResolver;
	}

	export type OkResolver = Resolver<boolean>;
	export type ErrorsResolver = Resolver<ReadonlyArray<SignInError>>;
	export type ResultResolver = Resolver<SignInResult | null>;
}

export namespace SignInErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver;
		endUserMessage?: EndUserMessageResolver;
		developerMessage?: DeveloperMessageResolver;
	}

	export type CodeResolver = Resolver<SignInErrorCode>;
	export type EndUserMessageResolver = Resolver<string | null>;
	export type DeveloperMessageResolver = Resolver<string | null>;
}

export namespace SignInResultResolvers {
	export interface Resolvers {
		token?: TokenResolver;
		person?: PersonResolver;
	}

	export type TokenResolver = Resolver<string>;
	export type PersonResolver = Resolver<Person>;
}

export namespace AddProjectMemberResponseResolvers {
	export interface Resolvers {
		ok?: OkResolver;
		errors?: ErrorsResolver;
	}

	export type OkResolver = Resolver<boolean>;
	export type ErrorsResolver = Resolver<ReadonlyArray<AddProjectMemberError>>;
}

export namespace AddProjectMemberErrorResolvers {
	export interface Resolvers {
		code?: CodeResolver;
		endUserMessage?: EndUserMessageResolver;
		developerMessage?: DeveloperMessageResolver;
	}

	export type CodeResolver = Resolver<AddProjectMemberErrorCode>;
	export type EndUserMessageResolver = Resolver<string | null>;
	export type DeveloperMessageResolver = Resolver<string | null>;
}

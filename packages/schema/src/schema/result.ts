import { Value } from './value'

export namespace Result {
	export type MutationFieldResult =
		| CreateResult
		| MultiCreateResult
		| UpdateResult
		| MultiUpdateResult
		| DeleteResult
		| MultiDeleteResult
		| UpsertResult
		| MultiUpsertResult

	export interface MutationResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
	}

	export type CreateResult =
		& MutationResult
		& {
			validation: ValidationResult
			node: Value.Object | null
		}

	export type MultiCreateResult =
		& MutationResult
		& {
			validation: ValidationResult
			nodes: Value.Object[]
		}

	export type UpsertResult =
		& MutationResult
		& {
			validation: ValidationResult
			node: Value.Object | null
		}

	export type MultiUpsertResult =
		& MutationResult
		& {
			validation: ValidationResult
			nodes: Value.Object[]
		}

	export type UpdateResult =
		& MutationResult
		& {
			validation: ValidationResult
			node: Value.Object | null
		}

	export type MultiUpdateResult =
		& MutationResult
		& {
			validation: ValidationResult
			nodes: Value.Object[]
		}

	export type DeleteResult =
		& MutationResult
		& {
			node: Value.Object | null
		}

	export type MultiDeleteResult =
		& MutationResult
		& {
			nodes: Value.Object[]
		}

	export interface TransactionResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
	}

	export interface ValidationResult {
		valid: boolean
		errors: ValidationError[]
	}

	export interface ValidationError {
		path: PathFragment[]
		message: ValidationMessage
	}

	export enum ExecutionErrorType {
		NotNullConstraintViolation = 'NotNullConstraintViolation',
		UniqueConstraintViolation = 'UniqueConstraintViolation',
		ForeignKeyConstraintViolation = 'ForeignKeyConstraintViolation',
		NotFoundOrDenied = 'NotFoundOrDenied',
		NonUniqueWhereInput = 'NonUniqueWhereInput',
		InvalidDataInput = 'InvalidDataInput',
		SqlError = 'SqlError',
	}

	export interface ExecutionError {
		/** @deprecated */
		path: PathFragment[]
		paths: PathFragment[][]
		type: ExecutionErrorType
		message?: string
	}

	export type PathFragment = { field: string } | { index: number; alias?: string }

	export interface ValidationMessage {
		text: string
	}
}

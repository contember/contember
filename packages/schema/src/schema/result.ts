import { Value } from './value'

export namespace Result {
	export type MutationFieldResult = CreateResult | UpdateResult | DeleteResult | UpsertResult

	export interface CreateResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface UpsertResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface UpdateResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface DeleteResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		node: Value.Object | null
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

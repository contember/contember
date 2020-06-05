import Value from './value'

namespace Result {
	export interface CreateResult {
		ok: boolean
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface UpdateResult {
		ok: boolean
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface DeleteResult {
		ok: boolean
		errors: ExecutionError[]
		node: Value.Object | null
	}

	export interface TransactionResult {
		ok: boolean
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
		path: PathFragment[]
		type: ExecutionErrorType
		message?: string
	}

	export type PathFragment = { field: string } | { index: number; alias?: string }

	export interface ValidationMessage {
		text: string
	}
}

export default Result

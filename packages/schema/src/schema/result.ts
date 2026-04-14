import { Value } from './value'

export namespace Result {
	export type MutationFieldResult = CreateResult | UpdateResult | DeleteResult | UpsertResult

	export interface TriggeredAction {
		id: string
		trigger: string
		target: string
	}

	export interface CreateResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
		triggeredActions: TriggeredAction[]
	}

	export interface UpsertResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
		triggeredActions: TriggeredAction[]
	}

	export interface UpdateResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		node: Value.Object | null
		triggeredActions: TriggeredAction[]
	}

	export interface DeleteResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		node: Value.Object | null
		triggeredActions: TriggeredAction[]
	}

	export interface TransactionResult {
		ok: boolean
		errorMessage?: string
		errors: ExecutionError[]
		validation: ValidationResult
		triggeredActions: TriggeredAction[]
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

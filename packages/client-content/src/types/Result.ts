import { Result } from '@contember/schema'

export type TransactionOkResult<V> = {
	readonly ok: true
	readonly errorMessage: null
	readonly errors: []
	readonly validation: ValidationOkResult
	readonly data: V
}
export type TransactionFailResult<V> = {
	readonly ok: false
	readonly errorMessage: string
	readonly errors: MutationError[]
	readonly validation: ValidationResult
	readonly data: V
}

export type TransactionResult<V> =
	| TransactionOkResult<V>
	| TransactionFailResult<V>

export type MutationOkResult<Value = unknown> = {
	readonly ok: true
	readonly errorMessage: null
	readonly errors: []
	readonly node: Value | null // still may be null
	readonly validation: ValidationOkResult
}

export type MutationFailResult = {
	readonly ok: boolean
	readonly errorMessage: string
	readonly errors: MutationError[]
	readonly node: null
	readonly validation: ValidationResult
}

export type MutationResult<Value = unknown> =
	| MutationOkResult<Value>
	| MutationFailResult

export type ValidationOkResult = {
	readonly valid: true
	readonly errors: []
}

export type ValidationFailResult = {
	readonly valid: false
	readonly errors: ValidationError[]
}

export type ValidationResult =
	| ValidationOkResult
	| ValidationFailResult

export type ValidationError = {
	readonly path: Path
	readonly message: { text: string }
}

export type MutationError = {
	readonly paths: Path[]
	readonly message: string
	readonly type: Result.ExecutionErrorType
}

export type Path = Array<FieldPath | IndexPath>

export type FieldPath = {
	readonly field: string
}
export type IndexPath = {
	readonly index: number
	readonly alias: string | null
}

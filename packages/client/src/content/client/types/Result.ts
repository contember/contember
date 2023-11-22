import { Result } from '@contember/schema'

export type TransactionResult<V> = {
	readonly ok: boolean
	readonly errorMessage: string | null
	readonly errors: MutationError[]
	readonly validation: ValidationResult
	readonly data: V
}

export type MutationResult<Value = unknown> = {
	readonly ok: boolean
	readonly errorMessage: string | null
	readonly errors: MutationError[]
	readonly node: Value | null
	readonly validation?: ValidationResult
}

export type ValidationResult = {
	readonly valid: boolean
	readonly errors: ValidationError[]
}

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

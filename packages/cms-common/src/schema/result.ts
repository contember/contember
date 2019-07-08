import Value from './value'

namespace Result {
	export interface CreateResult {
		ok: boolean
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface UpdateResult {
		ok: boolean
		validation: ValidationResult
		node: Value.Object | null
	}

	export interface ValidationResult {
		valid: boolean
		errors: ValidationError[]
	}

	export interface ValidationError {
		path: PathFragment[]
		message: ValidationMessage
	}

	export type PathFragment = { field: string } | { index: number; alias?: string }

	export interface ValidationMessage {
		text: string
	}
}

export default Result

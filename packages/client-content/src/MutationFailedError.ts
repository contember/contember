import { MutationError, ValidationResult } from './types'
import { ContentMutation } from './nodes'

export class MutationFailedError<Value extends {
	readonly ok: false
	readonly errorMessage: string
	readonly errors: MutationError[]
	readonly validation: ValidationResult
}> extends Error {
	constructor(
		message: string,
		public readonly request: ContentMutation<Value>,
		public readonly result: Value,
	) {
		super(message)
	}
}

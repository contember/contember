import { MutationError, ValidationResult } from './types/index.js'
import { ContentMutation } from './nodes/index.js'

export class MutationFailedError<
	Value extends {
		readonly ok: false
		readonly errorMessage: string
		readonly errors: MutationError[]
		readonly validation: ValidationResult
	},
> extends Error {
	constructor(
		message: string,
		public readonly request: ContentMutation<Value>,
		public readonly result: Value,
	) {
		super(message)
	}
}

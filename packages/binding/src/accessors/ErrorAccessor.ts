import { Result } from '@contember/client'

class ErrorAccessor {
	public constructor(
		public readonly validation: ErrorAccessor.ValidationErrors | undefined,
		public readonly execution: ErrorAccessor.ExecutionError | undefined, // TODO Apparently, there may be more than one?!
	) {}
}
namespace ErrorAccessor {
	export interface ExecutionError {
		type: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = [ErrorAccessor.ValidationError, ...ErrorAccessor.ValidationError[]]

	export interface ValidationError {
		message: string
	}
}
export { ErrorAccessor }

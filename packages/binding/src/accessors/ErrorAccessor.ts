import { Result } from '@contember/client'

class ErrorAccessor {
	public constructor(
		public readonly validation: ErrorAccessor.ValidationErrors | undefined,
		public readonly execution: ErrorAccessor.ExecutionErrors | undefined,
	) {}
}
namespace ErrorAccessor {
	export type ExecutionErrors = [ExecutionError, ...ExecutionError[]]
	export interface ExecutionError {
		type: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = [ValidationError, ...ValidationError[]]
	export interface ValidationError {
		message: string
	}
}
export { ErrorAccessor }

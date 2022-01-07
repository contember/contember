import type { Result } from '@contember/client'

class ErrorAccessor {
	public constructor(
		public readonly errors: ErrorAccessor.Error[],
	) {
	}
}

namespace ErrorAccessor {
	export type ErrorId = number
	export type Error = ExecutionError | ValidationError
	export type ErrorsById = Map<ErrorId, Error>

	export type ExecutionErrors = ExecutionError[]

	export interface ExecutionError {
		type: 'execution'
		code: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = ValidationError[]

	export interface ValidationError {
		type: 'validation'
		code: WellKnownErrorCode | string | undefined
		message: string
	}

	export type WellKnownErrorCode = 'fieldRequired'

	export const normalizeError = (error: Error | string): Error => typeof error === 'string' ? {
		type: 'validation',
		message: error,
		code: undefined,
	} : error
}
export { ErrorAccessor }

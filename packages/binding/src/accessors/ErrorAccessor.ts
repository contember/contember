import type { Result } from '@contember/client'

class ErrorAccessor {
	public readonly validation: ErrorAccessor.ValidationErrors | undefined
	public readonly execution: ErrorAccessor.ExecutionErrors | undefined

	public constructor(private readonly errors: ErrorAccessor.ErrorsById) {
		const validation: ErrorAccessor.ValidationError[] = []
		const execution: ErrorAccessor.ExecutionError[] = []

		for (const [key, boxed] of errors) {
			if (boxed.type === 'validation') {
				validation.push({
					key,
					message: typeof boxed.error === 'string' ? boxed.error : boxed.error.message,
					code: typeof boxed.error === 'string' ? undefined : boxed.error.code,
				})
			} else {
				execution.push({
					key,
					type: typeof boxed.error === 'string' ? boxed.error : boxed.error.type,
					developerMessage: typeof boxed.error === 'string' ? null : boxed.error.developerMessage,
				})
			}
		}
		this.validation = validation.length ? (validation as ErrorAccessor.ValidationErrors) : undefined
		this.execution = execution.length ? (execution as ErrorAccessor.ExecutionErrors) : undefined
	}
}
namespace ErrorAccessor {
	export type ErrorId = number
	export type BoxedError = BoxedExecutionError | BoxedValidationError
	export type ErrorsById = Map<ErrorId, BoxedError>

	export type ExecutionErrors = [ExecutionError, ...ExecutionError[]]
	export interface BoxedExecutionError {
		type: 'execution'
		error: SugaredExecutionError
	}
	export type SugaredExecutionError = Result.ExecutionErrorType | Omit<ExecutionError, 'key'>
	export interface ExecutionError {
		key: ErrorId
		type: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = [ValidationError, ...ValidationError[]]
	export interface BoxedValidationError {
		type: 'validation'
		error: SugaredValidationError
	}
	export type SugaredValidationError =
		| string
		| {
				message: string
				code?: string
		  }
	export interface ValidationError {
		key: ErrorId
		message: string
		code: WellKnownErrorCode | string | undefined
	}

	export type WellKnownErrorCode = 'fieldRequired'
}
export { ErrorAccessor }

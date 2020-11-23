import { Result } from '@contember/client'

class ErrorAccessor {
	public readonly validation: ErrorAccessor.ValidationErrors | undefined
	public readonly execution: ErrorAccessor.ExecutionErrors | undefined

	public constructor(private readonly errors: ErrorAccessor.ErrorsById) {
		const validation: ErrorAccessor.ValidationError[] = []
		const execution: ErrorAccessor.ExecutionError[] = []

		for (const [, boxed] of errors) {
			if (boxed.type === ErrorAccessor.ErrorType.Validation) {
				validation.push(boxed.error)
			} else {
				execution.push(boxed.error)
			}
		}
		this.validation = validation.length ? (validation as ErrorAccessor.ValidationErrors) : undefined
		this.execution = execution.length ? (execution as ErrorAccessor.ExecutionErrors) : undefined
	}
}
namespace ErrorAccessor {
	export enum ErrorType {
		Validation = 'validation',
		Execution = 'execution',
	}
	export type ErrorId = number
	export type BoxedError = BoxedExecutionError | BoxedValidationError
	export type ErrorsById = Map<ErrorId, BoxedError>

	export type ExecutionErrors = [ExecutionError, ...ExecutionError[]]
	export type BoxedExecutionError = {
		type: ErrorType.Execution
		error: ExecutionError
	}
	export interface ExecutionError {
		type: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = [ValidationError, ...ValidationError[]]
	export type BoxedValidationError = {
		type: ErrorType.Validation
		error: ValidationError
	}
	export interface ValidationError {
		message: string
	}
}
export { ErrorAccessor }

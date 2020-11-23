import { Result } from '@contember/client'

class ErrorAccessor {
	public readonly validation: ErrorAccessor.ValidationErrors | undefined
	public readonly execution: ErrorAccessor.ExecutionErrors | undefined

	public constructor(private readonly errors: ErrorAccessor.ErrorsById) {
		const validation: ErrorAccessor.ValidationError[] = []
		const execution: ErrorAccessor.ExecutionError[] = []

		for (const [key, boxed] of errors) {
			if (boxed.type === ErrorAccessor.ErrorType.Validation) {
				validation.push({
					key,
					message: typeof boxed.error === 'string' ? boxed.error : boxed.error.message,
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
	export type AddError = (error: ErrorAccessor.SugaredValidationError) => () => void
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
		error: SugaredExecutionError
	}
	export type SugaredExecutionError = Result.ExecutionErrorType | Omit<ExecutionError, 'key'>
	export interface ExecutionError {
		key: ErrorId
		type: Result.ExecutionErrorType
		developerMessage: string | null
	}

	export type ValidationErrors = [ValidationError, ...ValidationError[]]
	export type BoxedValidationError = {
		type: ErrorType.Validation
		error: SugaredValidationError
	}
	export type SugaredValidationError = string | Omit<ValidationError, 'key'>
	export interface ValidationError {
		key: ErrorId
		message: string
	}
}
export { ErrorAccessor }

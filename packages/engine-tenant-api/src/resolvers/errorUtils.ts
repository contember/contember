import { ResponseError } from '../model/utils/Response'

type Error<T> = { code: T; developerMessage: string }
type ErrorResponse<T, Meta = {}> = { ok: false; error: Error<T> & Meta; errors: [Error<T> & Meta] }


export function createErrorResponse <const T extends string, Meta extends {} | undefined>(responseError: ResponseError<T, Meta>): ErrorResponse<T, Meta>
export function createErrorResponse <const T extends string>(code: T, developerMessage: string): ErrorResponse<T>
export function createErrorResponse (codeOrErrorResponse: string | ResponseError<any>, developerMessage?: string): ErrorResponse<any> {
	if (typeof codeOrErrorResponse === 'string') {
		if (!developerMessage) {
			throw new Error('Developer message is required when passing a string as code.')
		}
		const error = { code: codeOrErrorResponse, developerMessage }
		return { ok: false, error, errors: [error] }
	}
	const error = { code: codeOrErrorResponse.error, developerMessage: codeOrErrorResponse.errorMessage, ...(codeOrErrorResponse.metadata ?? {}) }
	return {
		ok: false,
		error,
		errors: [error],
	}
}

export const createProjectNotFoundResponse = <const T extends string>(code: T, projectSlug: string): ErrorResponse<T> =>
	createErrorResponse(code, `Project ${projectSlug} was not found or you are not allowed to access it.`)

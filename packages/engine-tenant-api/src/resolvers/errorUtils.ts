type Error<T> = { code: T; developerMessage: string }
type ErrorResponse<T> = { ok: false; error: Error<T>; errors: [Error<T>] }
export const createErrorResponse = <T>(code: T, developerMessage: string): ErrorResponse<T> => {
	const error = { code, developerMessage }
	return { ok: false, error, errors: [error] }
}
export const createProjectNotFoundResponse = <T>(code: T, projectSlug: string): ErrorResponse<T> =>
	createErrorResponse(code, `Project ${projectSlug} was not found or you are not allowed to access it.`)

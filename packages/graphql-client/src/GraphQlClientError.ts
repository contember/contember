export type GraphQlErrorRequest = { url: string; query: string; variables: Record<string, any> }

export type GraphQlErrorType =
	| 'aborted'
	| 'network error'
	| 'invalid response body'
	| 'bad request'
	| 'unauthorized'
	| 'forbidden'
	| 'server error'
	| 'response errors'

export class GraphQlClientError extends Error {
	constructor(
		message: string,
		public readonly type: GraphQlErrorType,
		public readonly request: GraphQlErrorRequest,
		public readonly response?: Response,
		public readonly errors?: readonly any[],
		cause?: unknown,
	) {
		super(message)
		this.cause = cause
	}
}

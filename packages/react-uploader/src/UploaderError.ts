export type UploaderErrorType =
	| 'fileRejected'
	| 'networkError'
	| 'httpError'
	| 'aborted'
	| 'timeout'

export interface UploaderErrorOptions {
	type: UploaderErrorType
	endUserMessage?: string
	developerMessage?: string
	error?: unknown
}

export class UploaderError extends Error {
	public constructor(public readonly options: UploaderErrorOptions) {
		super(`File upload failed: ${options.type}`)
	}
}


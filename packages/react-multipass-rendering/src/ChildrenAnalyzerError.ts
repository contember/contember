export class ChildrenAnalyzerError extends Error {
	public cause?: unknown
	public details?: string

	constructor(message: string, options?: { cause: unknown, details?: string }) {
		super(message)
		this.details = options?.details
		if ((typeof options === 'object' && 'cause' in options)) {
			this.cause = options.cause
		}
	}
}

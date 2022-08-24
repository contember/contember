export class ChildrenAnalyzerError extends Error {
	public details?: string

	constructor(message: string, options?: { cause: Error, details?: string }) {
		super(message, options)
		this.details = options?.details
	}
}

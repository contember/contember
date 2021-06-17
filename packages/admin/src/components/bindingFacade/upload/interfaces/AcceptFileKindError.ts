export interface AcceptFileKindErrorOptions {
	userMessage: string
}

export class AcceptFileKindError extends Error {
	public constructor(public readonly options: AcceptFileKindErrorOptions) {
		super(options.userMessage)
	}
}

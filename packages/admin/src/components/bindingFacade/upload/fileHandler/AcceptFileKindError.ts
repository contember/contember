export interface AcceptFileKindErrorOptions {
	endUserMessage: string
}

export class AcceptFileKindError extends Error {
	public constructor(public readonly options: AcceptFileKindErrorOptions) {
		super(options.endUserMessage)
	}
}

export type Response<Result, Error, ErrorMetadata = undefined> = ResponseOk<Result> | (Error extends never ? never : ResponseError<Error, ErrorMetadata>)

export class ResponseOk<Result> {
	public readonly ok = true

	constructor(public readonly result: Result) {}
}

export class ResponseError<const Error, Metadata = undefined> {
	public readonly ok = false

	constructor(
		public readonly error: Error,
		public readonly errorMessage: string,
		public readonly metadata?: Metadata,
	) {}
}

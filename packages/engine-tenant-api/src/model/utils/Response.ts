export type Response<Result, Error> = ResponseOk<Result> | (Error extends never ? never : ResponseError<Error>)

export class ResponseOk<Result> {
	public readonly ok = true

	constructor(public readonly result: Result) {}
}

export class ResponseError<const Error> {
	public readonly ok = false

	constructor(public readonly error: Error, public readonly errorMessage: string) {}
}

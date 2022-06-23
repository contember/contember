export class BadRequestError extends Error {
	constructor(
		public readonly code: number,
		message: string,
	) {
		super(message)
	}
}

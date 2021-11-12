export class BadRequestError {
	constructor(
		public readonly code: number,
		public readonly message: string,
	) {
	}
}

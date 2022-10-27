export class HttpResponse {
	constructor(
		public readonly code: number,
		public readonly body?: string,
		public readonly contentType?: string,
	) {
	}
}

export class HttpErrorResponse extends HttpResponse {
	constructor(
		public readonly code: number,
		public readonly message?: string,
	) {
		super(
			code,
			message ? JSON.stringify({ errors: [{ code, message }] }) : undefined,
			'application/json',
		)
	}
}

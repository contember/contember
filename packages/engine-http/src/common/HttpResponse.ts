export class HttpResponse {
	constructor(
		public readonly code: number,
		public readonly body?: string,
		public readonly contentType?: string,
		/** Extra response headers. Use for signals a client must act on, since an error body is not always readable. */
		public readonly headers?: Readonly<Record<string, string>>,
	) {
	}
}

export class HttpErrorResponse extends HttpResponse {
	constructor(
		code: number,
		public readonly message?: string,
		headers?: Readonly<Record<string, string>>,
	) {
		super(
			code,
			message ? JSON.stringify({ errors: [{ code, message }] }) : undefined,
			'application/json',
			headers,
		)
	}
}

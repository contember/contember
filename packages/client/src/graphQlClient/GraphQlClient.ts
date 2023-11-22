export interface GraphQlClientRequestOptions {
	variables?: GraphQlClientVariables
	apiToken?: string
	signal?: AbortSignal
	headers?: Record<string, string>
	onResponse?: (response: Response) => void
	onData?: (json: unknown) => void

	/**
	 * @deprecated use apiToken
	 */
	apiTokenOverride?: string
}

export interface GraphQlClientVariables {
	[name: string]: any
}

export type GraphQlClientFailedRequestMetadata = Pick<Response, 'status' | 'statusText'> & {
	responseText: string
}

export class GraphQlClient {
	constructor(public readonly apiUrl: string, private readonly apiToken?: string) { }

	async execute<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		let body: string | null = null
		let response: Response | null = null
		const createError = (type: GraphqlErrorType, errors?: any[], cause?: unknown) => {
			const request = {
				url: this.apiUrl,
				query,
				variables: options.variables ?? {},
			}

			const details = `HTTP response: ${response ? (response.status + ' ' + response.statusText) : '<no response>'}
HTTP body: 
${body !== null ? body : '<no body>'}

GraphQL query: 
${query}`

			return new GraphQlClientError(`GraphQL request failed: ${type}`, type, request, response ?? undefined, errors, details, cause)
		}
		try {
			response = await this.doExecute(query, options)
		} catch (e) {
			const aborted = typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError'
			throw createError(aborted ? 'aborted' : 'network error', undefined, e)
		}

		options?.onResponse?.(response)

		body = await response.text()

		let data: any
		try {
			data = JSON.parse(body)
		} catch (e) {
			throw createError('invalid response body', undefined, e)
		}
		options?.onData?.(data)

		if (response.status === 401) {
			throw createError('unauthorized')
		}
		if (response.status === 403) {
			throw createError('forbidden')
		}
		if (response.status >= 400 && response.status < 500) {
			throw createError('bad request', data.errors)
		}
		if (response.status >= 500) {
			throw createError('server error')
		}
		if (!(typeof data === 'object') || data === null) {
			throw createError('invalid response body')
		}
		if ('errors' in data) {
			throw createError('response errors', data.errors)
		}
		if (!('data' in data)) {
			throw createError('invalid response body')
		}

		return data.data
	}

	/**
	 * @deprecated use execute
	 */
	async sendRequest<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		console.debug(query)
		const response = await this.doExecute(query, options)

		if (response.ok) {
			// It may still have errors (e.g. unfilled fields) but as far as the request goes, it is ok.
			return await response.json()
		}

		const failedRequest: GraphQlClientFailedRequestMetadata = {
			status: response.status,
			statusText: response.statusText,
			responseText: await response.text(),
		}

		return Promise.reject(failedRequest)
	}


	private async doExecute(
		query: string,
		{ apiToken, apiTokenOverride, signal, variables, headers }: GraphQlClientRequestOptions = {},
	): Promise<Response> {
		const resolvedHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			...headers,
		}
		const resolvedToken = apiToken ?? apiTokenOverride ?? this.apiToken

		if (resolvedToken !== undefined) {
			resolvedHeaders['Authorization'] = `Bearer ${resolvedToken}`
		}

		return await fetch(this.apiUrl, {
			method: 'POST',
			headers: resolvedHeaders,
			signal,
			body: JSON.stringify({ query, variables }),
		})
	}
}

export type GraphqlErrorRequest = { url: string, query: string, variables: Record<string, any> };

export type GraphqlErrorType =
	| 'aborted'
	| 'network error'
	| 'invalid response body'
	| 'bad request'
	| 'unauthorized'
	| 'forbidden'
	| 'server error'
	| 'response errors'

export class GraphQlClientError extends Error {
	constructor(
		message: string,
		public readonly type: GraphqlErrorType,
		public readonly request: GraphqlErrorRequest,
		public readonly response?: Response,
		public readonly errors?: readonly any[],
		public readonly details?: string,
		cause?: unknown,
	) {
		super(message)
		this.cause = cause
	}
}

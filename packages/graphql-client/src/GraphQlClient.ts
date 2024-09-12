import { GraphQlClientError, GraphQlErrorType } from './GraphQlClientError'
import { GraphQlClientRequestOptions } from './GraphQlClientRequestOptions'

export class GraphQlClient {
	constructor(
		public readonly apiUrl: string,
		private readonly apiToken?: string,
		private readonly fetch = defaultFetcher,
	) { }

	async execute<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		let body: string | null = null
		let response: Response | null = null
		const createError = (type: GraphQlErrorType, errors?: any[], cause?: unknown) => {
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

		options?.onBeforeRequest?.({ query, variables: options.variables ?? {} })

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


	protected async doExecute(
		query: string,
		{ apiToken, signal, variables, headers }: GraphQlClientRequestOptions = {},
	): Promise<Response> {
		const resolvedHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			...headers,
		}
		const resolvedToken = apiToken ?? this.apiToken

		if (resolvedToken !== undefined) {
			resolvedHeaders['Authorization'] = `Bearer ${resolvedToken}`
		}

		return await this.fetch(this.apiUrl, {
			method: 'POST',
			headers: resolvedHeaders,
			signal,
			body: JSON.stringify({ query, variables }),
		})
	}
}

const defaultFetcher = async (url: string, options: RequestInit) => fetch(url, options)

import { GraphQlClientError, GraphQlErrorType } from './GraphQlClientError.js'
import { GraphQlClientBaseOptions, GraphQlClientOptions, GraphQlClientRequestOptions } from './GraphQlClientRequestOptions.js'
import { PrimaryReadWindow } from './PrimaryReadWindow.js'

export class GraphQlClient {
	constructor(
		private readonly options: GraphQlClientOptions,
	) {
		if (options.credentials !== undefined && options.apiToken !== undefined) {
			throw new Error('GraphQlClient: set either `credentials` or `apiToken`, not both.')
		}
	}

	get apiUrl(): string {
		return this.options.url
	}

	withOptions(options: Partial<GraphQlClientOptions>): GraphQlClient {
		return new GraphQlClient({ ...this.options, ...options })
	}

	async execute<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		const credentials = this.options.credentials
		if (credentials !== undefined && options.apiToken !== undefined) {
			throw new Error('GraphQlClient: a per-request `apiToken` cannot be combined with client `credentials`.')
		}
		let body: string | null = null
		let response: Response | null = null
		const createError = (type: GraphQlErrorType, errors?: any[], cause?: unknown) => {
			const request = {
				url: this.options.url,
				query,
				variables: options.variables ?? {},
			}

			const message = `GraphQL request failed: ${type}
			
HTTP response: ${response ? (response.status + ' ' + response.statusText) : '<no response>'}
HTTP body: 
${body !== null ? body : '<no body>'}

GraphQL query: 
${query}`

			return new GraphQlClientError(message, type, request, response ?? undefined, errors, cause)
		}

		const createNetworkError = (e: unknown) => {
			const aborted = typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError'
			return createError(aborted ? 'aborted' : 'network error', undefined, e)
		}

		this.options?.onBeforeRequest?.({ query, variables: options.variables ?? {} })
		options?.onBeforeRequest?.({ query, variables: options.variables ?? {} })

		// Credential errors (e.g. a missing token source) propagate as thrown by the provider, not as a network error.
		const credentialHeaders = await credentials?.authenticate({ url: this.options.url, method: 'POST', refresh: false })
		try {
			response = await this.doExecute(query, options, credentialHeaders)
		} catch (e) {
			throw createNetworkError(e)
		}
		// The engine authenticates before parsing the request, so a 401 means nothing ran and one retry is safe.
		if (response.status === 401 && credentials !== undefined) {
			try {
				await response.body?.cancel()
			} catch (e) {
				throw createNetworkError(e)
			}
			const refreshedHeaders = await credentials.authenticate({ url: this.options.url, method: 'POST', refresh: true })
			try {
				response = await this.doExecute(query, options, refreshedHeaders)
			} catch (e) {
				throw createNetworkError(e)
			}
		}

		try {
			this.options?.onResponse?.(response)
			options?.onResponse?.(response)

			body = await response.text()
		} catch (e) {
			throw createNetworkError(e)
		} finally {
			// Start once the body has arrived, and even if reading it or a user hook failed: an earlier mutation field may have committed.
			if (response !== null) {
				this.resolvePrimaryReadWindow(options)?.captureResponse(response)
			}
		}

		let data: any
		try {
			data = JSON.parse(body)
		} catch (e) {
			throw createError('invalid response body', undefined, e)
		}
		this.options?.onData?.(data)
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
		options: GraphQlClientRequestOptions = {},
		credentialHeaders: Record<string, string> = {},
	): Promise<Response> {
		const { apiToken, signal, variables, headers } = options
		const resolvedHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			...this.options.headers,
			...headers,
		}
		if (!new Headers(resolvedHeaders).has('X-Contember-Force-Primary')) {
			Object.assign(resolvedHeaders, this.resolvePrimaryReadWindow(options)?.requestHeaders())
		}
		const resolvedToken = apiToken ?? this.options.apiToken

		if (resolvedToken !== undefined) {
			resolvedHeaders['Authorization'] = `Bearer ${resolvedToken}`
		}
		Object.assign(resolvedHeaders, credentialHeaders)

		return await (this.options.fetcher ?? defaultFetcher)(this.options.url, {
			method: 'POST',
			headers: resolvedHeaders,
			signal,
			body: JSON.stringify({ query, variables }),
		})
	}

	private resolvePrimaryReadWindow(options: GraphQlClientBaseOptions): PrimaryReadWindow | undefined {
		return (options.primaryReadWindow ?? this.options.primaryReadWindow) || undefined
	}
}

const defaultFetcher = async (url: string, options: RequestInit) => fetch(url, options)

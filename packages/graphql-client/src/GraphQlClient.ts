import { GraphQlClientError, GraphQlErrorType } from './GraphQlClientError.js'
import { GraphQlClientBaseOptions, GraphQlClientOptions, GraphQlClientRequestOptions } from './GraphQlClientRequestOptions.js'
import { PrimaryReadWindow } from './PrimaryReadWindow.js'

export class GraphQlClient {
	constructor(
		private readonly options: GraphQlClientOptions,
	) {}

	get apiUrl(): string {
		return this.options.url
	}

	withOptions(options: Partial<GraphQlClientOptions>): GraphQlClient {
		return new GraphQlClient({ ...this.options, ...options })
	}

	async execute<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
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

		this.options?.onBeforeRequest?.({ query, variables: options.variables ?? {} })
		options?.onBeforeRequest?.({ query, variables: options.variables ?? {} })

		try {
			response = await this.doExecute(query, options)
			// A later mutation field can fail after an earlier one committed; capture before checking the body or calling user hooks.
			this.resolvePrimaryReadWindow(options)?.captureResponse(response)
			this.options?.onResponse?.(response)
			options?.onResponse?.(response)

			body = await response.text()
		} catch (e) {
			const aborted = typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError'
			throw createError(aborted ? 'aborted' : 'network error', undefined, e)
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
	): Promise<Response> {
		const { apiToken, signal, variables, headers } = options
		const resolvedHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			...this.options.headers,
			...headers,
		}
		if (!Object.keys(resolvedHeaders).some(name => name.toLowerCase() === 'x-contember-force-primary')) {
			Object.assign(resolvedHeaders, this.resolvePrimaryReadWindow(options)?.requestHeaders())
		}
		const resolvedToken = apiToken ?? this.options.apiToken

		if (resolvedToken !== undefined) {
			resolvedHeaders['Authorization'] = `Bearer ${resolvedToken}`
		}

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

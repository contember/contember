import { PrimaryReadWindow } from './PrimaryReadWindow.js'

export interface GraphQlClientBaseOptions {
	readonly apiToken?: string
	readonly headers?: Record<string, string>
	readonly onBeforeRequest?: (query: { query: string; variables: GraphQlClientVariables }) => void
	readonly onResponse?: (response: Response) => void
	readonly onData?: (json: unknown) => void
	/** Temporarily route reads to the primary after a Content API mutation. False disables the client-wide window for this request. */
	readonly primaryReadWindow?: PrimaryReadWindow | false
}

export interface GraphQlClientOptions extends GraphQlClientBaseOptions {
	readonly url: string
	readonly fetcher?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

export interface GraphQlClientRequestOptions extends GraphQlClientBaseOptions {
	readonly variables?: GraphQlClientVariables
	readonly signal?: AbortSignal
}

export interface GraphQlClientVariables {
	[name: string]: any
}

import { WriteRefTracker } from './WriteRefTracker.js'

export interface GraphQlClientBaseOptions {
	readonly apiToken?: string
	readonly headers?: Record<string, string>
	readonly onBeforeRequest?: (query: { query: string; variables: GraphQlClientVariables }) => void
	readonly onResponse?: (response: Response) => void
	readonly onData?: (json: unknown) => void
	/** Carries outstanding write references to the server and picks up the ones it returns. */
	readonly readAfterWrite?: WriteRefTracker
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

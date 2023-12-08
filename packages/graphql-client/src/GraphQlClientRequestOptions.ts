export interface GraphQlClientRequestOptions {
	variables?: GraphQlClientVariables
	apiToken?: string
	signal?: AbortSignal
	headers?: Record<string, string>
	onResponse?: (response: Response) => void
	onData?: (json: unknown) => void
}

export interface GraphQlClientVariables {
	[name: string]: any
}

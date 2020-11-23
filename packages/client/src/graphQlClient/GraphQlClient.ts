class GraphQlClient {
	constructor(private readonly apiUrl: string, private readonly apiToken?: string) {}

	async sendRequest<T = any>(
		query: string,
		{ apiTokenOverride, signal, variables }: GraphQlClient.RequestOptions = {},
	): Promise<T> {
		const headers: {
			[header: string]: string
		} = {
			'Content-Type': 'application/json',
		}

		const resolvedToken = apiTokenOverride ?? this.apiToken
		if (resolvedToken !== undefined) {
			headers['Authorization'] = `Bearer ${resolvedToken}`
		}

		console.debug(query)

		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers,
			signal,
			body: JSON.stringify({ query, variables }),
		})
		if (response.ok) {
			// It may still have errors (e.g. unfilled fields) but as far as the request goes, it is ok.
			return await response.json()
		}
		const failedRequest: GraphQlClient.FailedRequestMetadata = {
			status: response.status,
			statusText: response.statusText,
			responseText: await response.text(),
		}

		return Promise.reject(failedRequest)
	}
}

namespace GraphQlClient {
	export interface RequestOptions {
		variables?: GraphQlClient.Variables
		apiTokenOverride?: string
		signal?: AbortSignal
	}

	export type Variables = { [name: string]: any }

	export type FailedRequestMetadata = Pick<Response, 'status' | 'statusText'> & {
		responseText: string
	}
}

export { GraphQlClient }

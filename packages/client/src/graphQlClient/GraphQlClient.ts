class GraphQlClient {
	constructor(private readonly apiUrl: string) {}

	async sendRequest<T = any>(
		query: string,
		variables: GraphQlClient.Variables,
		apiToken: string | undefined,
	): Promise<T> {
		const headers: {
			[header: string]: string
		} = {
			'Content-Type': 'application/json',
		}

		if (apiToken !== undefined) {
			headers['Authorization'] = `Bearer ${apiToken}`
		}

		console.debug(query)

		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers,
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
	export type Variables = { [name: string]: any }

	export type FailedRequestMetadata = Pick<Response, 'status' | 'statusText'> & {
		responseText: string
	}
}

export { GraphQlClient }

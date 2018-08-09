type Variables = { [name: string]: any }
type Headers = { [name: string]: string }

class GraphqlClient {
	constructor(private readonly apiUrl: string) {}

	async request<T = any>(query: string, variables: Variables, apiToken?: string): Promise<T> {
		const headers: Headers = {
			'Content-Type': 'application/json'
		}

		if (apiToken) {
			headers['Authorization'] = `Bearer ${apiToken}`
		}

		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers,
			body: JSON.stringify({ query, variables })
		})
		if (response.ok) {
			const result = await response.json()
			if (response.ok && !result.errors && result.data) {
				return result.data
			} else {
				throw new GraphqlClient.GraphqlClientError(
					{ query, variables },
					{ status: response.status, body: await response.text() }
				)
			}
		} else {
			throw new GraphqlClient.GraphqlServerError(
				{ query, variables },
				{ status: response.status, body: await response.text() }
			)
		}
	}
}

namespace GraphqlClient {
	export class GraphqlError extends Error {
		request: any
		response: any
		constructor(request: any, response: any) {
			let message = 'An GraphQL error occured'
			if (
				typeof response === 'object' &&
				Array.isArray(response.error) &&
				response.error[0] &&
				response.error[0].message
			) {
				message = response.error[0].message
			} else if (response.status) {
				message = `API responded with ${response.status} status code`
			}
			super(`${message}: ${JSON.stringify({ request, response })}`)
			this.request = request
			this.response = response
		}
	}
	export class GraphqlServerError extends GraphqlError {}
	export class GraphqlClientError extends GraphqlError {}
}

export default GraphqlClient

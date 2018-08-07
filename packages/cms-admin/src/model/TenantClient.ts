const tenantApi = 'http://localhost:4000/tenant'

type Variables = { [name: string]: any }

export async function request<T = any>(query: string, variables: Variables): Promise<T> {
	const response = await fetch(tenantApi, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query, variables })
	})

	if (response.ok) {
		const result = await response.json()
		if (response.ok && !result.errors && result.data) {
			return result.data
		} else {
			throw new GraphqlError()
		}
	} else {
		throw new GraphqlError(`API responded with not-ok status code: ${response.status} (${response.statusText})`)
	}
}

class GraphqlError extends Error {}

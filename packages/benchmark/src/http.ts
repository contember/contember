import fetch, { RequestInit } from 'node-fetch'

export const createHttpOptions = (options: {
	query: string
	variables?: Record<string, any>
	authorizationToken: string
}): RequestInit => {
	return {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${options.authorizationToken}`,
		},
		body: JSON.stringify({ query: options.query, variables: options.variables }),
	}
}

export const graphqlRequest = async (options: {
	endpoint: string
	query: string
	variables?: Record<string, any>
	authorizationToken: string
	noTrx?: boolean
}) => {
	const response = await fetch(options.endpoint, createHttpOptions(options))
	const jsonResponse = await response.json()

	if (jsonResponse.errors) {
		throw new Error('Graphql request failed: ' + JSON.stringify(jsonResponse.errors))
	}
	return jsonResponse
}

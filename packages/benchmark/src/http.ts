import request from 'request'

export const httpRequest = (options: request.OptionsWithUrl) => {
	return new Promise<request.Response>((resolve, reject) => {
		request(options, (err, response) => {
			if (err) {
				return reject(err)
			}
			resolve(response)
		})
	})
}

export const createHttpOptions = (options: {
	endpoint: string
	query: string
	variables?: Record<string, any>
	authorizationToken: string
}): request.OptionsWithUrl => {
	return {
		url: options.endpoint,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${options.authorizationToken}`,
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
	const response = await httpRequest(createHttpOptions(options))
	const jsonResponse = JSON.parse(response.body)

	if (jsonResponse.errors) {
		throw new Error('Graphql request failed: ' + JSON.stringify(jsonResponse.errors))
	}
	return jsonResponse
}

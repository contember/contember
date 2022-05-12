import fetch, { Response } from 'node-fetch'
import { ApiEndpointResolver } from './ApiEndpointResolver'

export interface ApiRequest {
	token: string
	query: string
	path: string
	variables?: any
	projectGroup?: string
}


export class ApiRequestSender {
	constructor(
		private apiEndpointResolver: ApiEndpointResolver,
	) {}

	public async send({ projectGroup, query, token, variables, path }: ApiRequest): Promise<Response> {
		const { endpoint, hostname } = this.apiEndpointResolver.resolve(projectGroup)
		return await fetch(`${endpoint.toString()}${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
				'Host': hostname,
			},
			body: JSON.stringify({ query, variables }),
		})
	}
}

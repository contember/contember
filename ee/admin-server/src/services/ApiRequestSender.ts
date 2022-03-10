import { BadRequestError } from '../BadRequestError'
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
		const resolved = this.apiEndpointResolver.resolve(projectGroup)
		if (!resolved) {
			throw new BadRequestError(400, 'Cannot resolve API endpoint')
		}
		const { endpoint, hostname } = resolved
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

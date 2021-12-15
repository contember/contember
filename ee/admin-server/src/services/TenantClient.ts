import fetch, { Response } from 'node-fetch'
import { array, nullable, object, string } from '../utils/schema'
import { ApiEndpointResolver } from './ApiEndpointResolver'
import { BadRequestError } from '../BadRequestError'

const ProjectBySlugResponseType = object({
	data: object({
		projectBySlug: nullable(
			object({
				id: string,
			}),
		),
	}),
})

const MeResponseType = object({
	data: object({
		me: object({
			id: string,
			person: object({
				id: string,
				email: string,
			}),
			projects: array(
				object({
					project: object({
						slug: string,
						name: string,
					}),
					memberships: array(
						object({
							role: string,
							variables: array(
								object({
									name: string,
									values: array(string),
								}),
							),
						}),
					),
				}),
			),
		}),
	}),
})

interface TenantApiRequest {
	token: string
	query: string
	variables?: any
	projectGroup?: string
}

export class TenantClient {
	constructor(
		private apiEndpointResolver: ApiEndpointResolver,
	) {}

	async hasProjectAccess(token: string, projectSlug: string, projectGroup: string | undefined): Promise<boolean> {
		const response = await this.request({
			token,
			projectGroup,
			query: `
				query($projectSlug: String!) {
					projectBySlug(slug: $projectSlug) {
						id
					}
				}
			`,
			variables: {
				projectSlug,
			},
		})

		if (!response.ok) {
			return false
		}

		const payload = ProjectBySlugResponseType(await response.json())
		return payload.data.projectBySlug !== null
	}


	async getMe(token: string, projectGroup: string | undefined) {
		const response = await this.request({
			token,
			projectGroup,
			query: `
				query {
					me {
						id

						person {
							id
							email
						}

						projects {
							project {
								slug
								name
							}

							memberships {
								role
								variables {
									name
									values
								}
							}
						}
					}
				}
			`,
		})

		if (!response.ok) {
			return null
		}

		const payload = MeResponseType(await response.json())
		return payload.data.me
	}

	private async request({ token, query, variables, projectGroup }: TenantApiRequest): Promise<Response> {
		const resolved = this.apiEndpointResolver.resolve(projectGroup)
		if (!resolved) {
			throw new BadRequestError(400, 'Cannot resolve API endpoint')
		}
		const { endpoint, hostname } = resolved
		return await fetch(`${endpoint.toString()}tenant`, {
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

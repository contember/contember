import fetch, { Response } from 'node-fetch'
import { array, nullable, object, string } from './schema'

const ProjectBySlugResponseType = object({
	data: object({
		projectBySlug: nullable(
			object({
				id: string,
			}),
		),
	}),
})

const ProjectListResponseType = object({
	data: object({
		projects: array(
			object({
				slug: string,
				name: string,
			}),
		),
	}),
})

const MeResponseType = object({
	data: object({
		me: object({
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
}

export class TenantApi {
	constructor(private apiEndpoint: string) {}

	async hasProjectAccess(token: string, projectSlug: string): Promise<boolean> {
		const response = await this.request({
			token,
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

	async listAccessibleProjects(token: string) {
		const response = await this.request({
			token,
			query: `
				query {
					projects {
						slug
						name
					}
				}
			`,
		})

		if (!response.ok) {
			return null
		}

		const payload = ProjectListResponseType(await response.json())
		return payload.data.projects
	}

	async getMe(token: string) {
		const response = await this.request({
			token,
			query: `
				query {
					me {
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

	private async request({ token, query, variables }: TenantApiRequest): Promise<Response> {
		return await fetch(`${this.apiEndpoint}/tenant`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({ query, variables }),
		})
	}
}

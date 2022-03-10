import { Response } from 'node-fetch'
import { array, nullable, object, string } from '../utils/schema'
import { ApiRequest, ApiRequestSender } from './ApiRequestSender'

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

type TenantApiRequest = Omit<ApiRequest, 'path'>

export class TenantClient {
	constructor(
		private apiRequestSender: ApiRequestSender,
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

	private async request(request: TenantApiRequest): Promise<Response> {
		return this.apiRequestSender.send({ ...request, path: 'tenant' })
	}
}

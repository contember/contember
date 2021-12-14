import { QueryRequestObject, useAuthedTenantQuery } from '../lib'

const ME_QUERY = `
	query {
		me {
			person {
				id
				email
				otpEnabled
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
`

interface MeResponse {
	me: {
		person: {
			id: string,
			email: string,
			otpEnabled: boolean,
		},
		projects: Array<{
			project: {
				slug: string,
				name: string,
			},
			memberships: Array<{
				role: string,
				variables: Array<{
					name: string,
					values: string[],
				}>,
			}>,
		}>,
	},
}

export const useTenantMe = (): QueryRequestObject<MeResponse> => {
	return useAuthedTenantQuery(ME_QUERY, {})
}

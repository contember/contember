import { useAuthedTenantQuery } from './lib'

const LIST_USERS_QUERY = `
	query($slug: String!) {
		project: projectBySlug(slug: $slug) {
			id
			name
			slug
			members(memberType: PERSON) {
				identity {
					id
					person {
						id
						email
					}
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

export interface Membership {
	role: string
	variables: {
		name: string
		values: string[]
	}[]
}

interface ListUserQueryResult {
	project: {
		id: string
		name: string
		slug: string
		members: {
			identity: {
				id: string
				person?: {
					id: string
					email: string
				}
			}
			memberships: Membership[]
		}[]
	}
}

interface ListUserQueryVariables {
	slug: string
}

export const useListUsersQuery = (projectSlug: string) => {
	return useAuthedTenantQuery<ListUserQueryResult, ListUserQueryVariables>(LIST_USERS_QUERY, { slug: projectSlug })
}

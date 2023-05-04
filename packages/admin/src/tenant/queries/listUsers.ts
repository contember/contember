import { useAuthedTenantQuery } from '../lib'
import { PROJECT_ROLES_FRAGMENT, RoleDefinition } from './roles'
import { Membership } from '../types'

const LIST_MEMBERS_QUERY = `
	${PROJECT_ROLES_FRAGMENT}
	query($slug: String!, $memberType: MemberType) {
		project: projectBySlug(slug: $slug) {
			id
			name
			slug
			... ProjectRoles
			members(memberType: $memberType) {
				identity {
					id
					description
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


export interface MemberIdentity {
	id: string
	description?: string
	person?: {
		id: string
		email: string
	}
}

export interface ListMembersQuery {
	project: {
		id: string
		name: string
		slug: string
		roles: RoleDefinition[]
		members: {
			identity: MemberIdentity
			memberships: Membership[]
		}[]
	}
}

export type ListMembersMemberType = 'PERSON' | 'API_KEY'

export interface ListMembersQueryVariables {
	slug: string
	memberType?: ListMembersMemberType
}

export const useListMembersQuery = (projectSlug: string, memberType: ListMembersQueryVariables['memberType']) => {
	return useAuthedTenantQuery<ListMembersQuery, ListMembersQueryVariables>(LIST_MEMBERS_QUERY, {
		slug: projectSlug,
		memberType,
	})
}

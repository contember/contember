import { useAuthedTenantQuery } from './lib'

const LIST_MEMBERSHIPS_QUERY = `
	query($slug: String!, $identityId: String!) {
		memberships: projectMemberships(projectSlug: $slug, identityId: $identityId) {
			role
			variables {
				name
				values
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
	memberships: Membership[]
}

interface ListUserQueryVariables {
	slug: string
	identityId: string
}

export const useProjectMembershipsQuery = (projectSlug: string, identityId: string) => {
	return useAuthedTenantQuery<ListUserQueryResult, ListUserQueryVariables>(LIST_MEMBERSHIPS_QUERY, {
		slug: projectSlug,
		identityId,
	})
}

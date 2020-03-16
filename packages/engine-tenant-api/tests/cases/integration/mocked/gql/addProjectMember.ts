import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { MembershipInput } from '../../../../../src/schema'

export const addProjectMemberMutation = (variables: {
	projectSlug: string
	identityId: string
	memberships: MembershipInput[]
}): GraphQLTestQuery => ({
	query: GQL`mutation($projectSlug: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
		addProjectMember(
			projectSlug: $projectSlug,
			identityId: $identityId,
			memberships: $memberships
		) {
			ok
			errors {
				code
			}
		}
	}`,
	variables,
})

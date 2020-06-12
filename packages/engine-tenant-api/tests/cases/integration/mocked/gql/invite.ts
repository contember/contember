import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { MembershipInput } from '../../../../../src/schema'

export const inviteMutation = (variables: {
	email: string
	projectSlug: string
	memberships: MembershipInput[]
}): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $projectSlug: String!, $memberships: [MembershipInput!]!) {
		invite(email: $email, projectSlug: $projectSlug, memberships: $memberships) {
			ok
			errors {
				code
			}
			result {
				person {
					id
					identity {
						id
					}
				}
			}
		}
	}`,
	variables,
})

import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { MembershipInput } from '../../../../../src/schema'

export const inviteMutation = (variables: {
	email: string
	projectSlug: string
	memberships: MembershipInput[]
	method?: string
}): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $projectSlug: String!, $memberships: [MembershipInput!]!, $method: InviteMethod) {
		invite(email: $email, projectSlug: $projectSlug, memberships: $memberships, options: {method: $method}) {
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

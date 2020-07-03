import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { MembershipInput } from '../../../../../src/schema'

export const unmanagedInviteMutation = (variables: {
	email: string
	projectSlug: string
	password: string
	memberships: MembershipInput[]
}): GraphQLTestQuery => ({
	query: GQL`mutation($email: String!, $projectSlug: String!, $password: String! $memberships: [MembershipInput!]!) {
		unmanagedInvite(email: $email, projectSlug: $projectSlug, memberships: $memberships, password: $password) {
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

import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { MembershipInput } from '../../../../../src/schema'

export const createApiKeyMutation = (variables: {
	projectSlug: string
	memberships: MembershipInput[]
	description: string
}): GraphQLTestQuery => ({
	query: GQL`mutation($projectSlug: String!, $memberships: [MembershipInput!]!, $description: String!) {
		createApiKey(projectSlug: $projectSlug, memberships: $memberships, description: $description) {
			ok
			errors {
				code
			}
			result  {
				apiKey {
					identity {
						projects {
							project {
								id
							}
							memberships {
								role
							}
						}
					}
				}
			}
		}
	}`,
	variables,
})

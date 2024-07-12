import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const changeProfileMutation = (variables: { personId: string; email?: string; name?: string }): GraphQLTestQuery => ({
	query: GQL`mutation($personId: String!, $email: String, $name: String) {
          changeProfile(personId: $personId, email: $email, name: $name) {
            ok
            error {
            	code
            }
          }
        }`,
	variables,
})

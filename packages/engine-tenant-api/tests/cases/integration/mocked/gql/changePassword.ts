import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const changePasswordMutation = (variables: { personId: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($personId: String!, $password: String!) {
          changePassword(personId: $personId, password: $password) {
            ok
          }
        }`,
	variables,
})

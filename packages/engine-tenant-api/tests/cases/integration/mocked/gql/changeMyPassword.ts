import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const changeMyPasswordMutation = (variables: { currentPassword: string; newPassword: string }): GraphQLTestQuery => ({
	query: GQL`mutation($currentPassword: String!, $newPassword: String!) {
          changeMyPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
            ok
            error {
                code
            }
          }
        }`,
	variables,
})

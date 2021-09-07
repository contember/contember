import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

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

import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'

export const changeMyProfileMutation = (variables: { email?: string | null; name?: string | null }): GraphQLTestQuery => ({
	query: GQL`mutation($email: String, $name: String) {
          changeMyProfile(email: $email, name: $name) {
            ok
            error {
                code
            }
          }
        }`,
	variables,
})

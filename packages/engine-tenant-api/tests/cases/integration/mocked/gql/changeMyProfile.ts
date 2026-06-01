import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

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

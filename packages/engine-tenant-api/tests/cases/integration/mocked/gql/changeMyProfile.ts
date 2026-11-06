import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const changeMyProfileMutation = (
	variables: { email?: string | null; name?: string | null; currentPassword?: string; otpToken?: string },
): GraphQLTestQuery => ({
	query: GQL`mutation($email: String, $name: String, $currentPassword: String, $otpToken: String) {
          changeMyProfile(email: $email, name: $name, currentPassword: $currentPassword, otpToken: $otpToken) {
            ok
            error {
                code
            }
          }
        }`,
	variables,
})

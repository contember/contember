import { GraphQLTestQuery } from './types'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

export const changePasswordMutation = (variables: { personId: string; password: string }): GraphQLTestQuery => ({
	query: GQL`mutation($personId: String!, $password: String!) {
          changePassword(personId: $personId, password: $password) {
            ok
          }
        }`,
	variables,
})

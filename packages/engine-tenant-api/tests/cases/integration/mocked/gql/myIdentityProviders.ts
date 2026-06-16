import { GraphQLTestQuery } from './types.js'
import { GQL } from '../../../../src/tags.js'

export const myIdentityProvidersQuery = (): GraphQLTestQuery => ({
	query: GQL`query {
          myIdentityProviders {
            id
            createdAt
            externalIdentifier
            identityProvider {
                slug
                type
                disabledAt
            }
          }
        }`,
	variables: {},
})

export const disconnectMyIdentityProviderMutation = (variables: { id: string }): GraphQLTestQuery => ({
	query: GQL`mutation($id: String!) {
          disconnectMyIdentityProvider(id: $id) {
            ok
            error {
                code
            }
          }
        }`,
	variables,
})

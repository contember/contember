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

export const disconnectMyIdentityProviderMutation = (variables: { identityProvider: string }): GraphQLTestQuery => ({
	query: GQL`mutation($identityProvider: String!) {
          disconnectMyIdentityProvider(identityProvider: $identityProvider) {
            ok
            error {
                code
            }
          }
        }`,
	variables,
})

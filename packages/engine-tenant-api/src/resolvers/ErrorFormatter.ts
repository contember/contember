import { GraphQLError, GraphQLFormattedError } from 'graphql'
import { ApolloError } from 'apollo-server-errors'

export const formatError = (error: GraphQLError): GraphQLFormattedError => {
	if (error.originalError instanceof ApolloError) {
		return error
	}
	console.error(error.originalError || error)
	return { message: 'Internal server error', locations: undefined, path: undefined }
}

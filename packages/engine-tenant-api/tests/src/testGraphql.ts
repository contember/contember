import 'jasmine'
import { graphql, GraphQLSchema } from 'graphql'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	const response = await graphql(test.schema, test.query, null, test.context, test.queryVariables)
	if ('errors' in response) {
		console.error((response.errors as any)[0])
		response.errors = (response.errors as any).map(({ message }: any) => ({ message }))
	}
	expect(response).toEqual(test.return)
}

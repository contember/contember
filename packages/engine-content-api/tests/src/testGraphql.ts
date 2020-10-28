import { graphql, GraphQLSchema } from 'graphql'
import * as assert from 'uvu/assert'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	const rawResponse = await graphql(test.schema, test.query, null, test.context, test.queryVariables)
	const response = JSON.parse(JSON.stringify(rawResponse))
	if ('errors' in response) {
		console.error((response.errors as any)[0])
		response.errors = (response.errors as any).map(({ message }: any) => ({ message }))
	}
	assert.equal(response, test.return)
}

import { graphql, GraphQLSchema } from 'graphql'
import { assert } from 'vitest'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	const rawResponse = await graphql({
		schema: test.schema,
		source: test.query,
		contextValue: test.context,
		variableValues: test.queryVariables,
	})
	const response = JSON.parse(JSON.stringify(rawResponse))
	if ('errors' in rawResponse) {
		if (rawResponse.errors?.length === 1 && 'originalError' in (rawResponse.errors as any)[0]) {
			throw (rawResponse.errors as any)[0].originalError
		}
		rawResponse.errors = (rawResponse.errors as any).map(({ message }: any) => ({ message }))
	}
	assert.deepStrictEqual(response, test.return)
}

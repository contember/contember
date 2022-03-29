import { graphql, GraphQLSchema } from 'graphql'
import { assert } from 'vitest'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object | ((data: object) => void)
}

export const executeGraphQlTest = async (test: Test) => {
	const response = await graphql(test.schema, test.query, null, test.context, test.queryVariables)
	if ('errors' in response) {
		console.error((response.errors as any)[0])
		response.errors = (response.errors as any).map(({ message }: any) => ({ message }))
	}
	const responseNormalized = JSON.parse(JSON.stringify(response))
	if (typeof test.return === 'function') {
		test.return(responseNormalized)
	} else {
		assert.deepStrictEqual(responseNormalized, test.return)
	}
}

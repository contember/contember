import { NullLoggerHandler, withLogger, createLogger } from '@contember/logger'
import { graphql, GraphQLSchema } from 'graphql'
import { expect } from 'bun:test'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	const logger = createLogger(new NullLoggerHandler())
	const rawResponse = await withLogger(logger, () => {
		return graphql({
			schema: test.schema,
			source: test.query,
			contextValue: test.context,
			variableValues: test.queryVariables,
		})
	})
	if ('errors' in rawResponse) {
		if (rawResponse.errors?.length === 1 && (rawResponse.errors as any)[0].originalError) {
			throw (rawResponse.errors as any)[0].originalError
		}
		rawResponse.errors = (rawResponse.errors as any).map(({ message }: any) => ({ message }))
	}
	const response = JSON.parse(JSON.stringify(rawResponse))
	expect(response).toStrictEqual(test.return)
}

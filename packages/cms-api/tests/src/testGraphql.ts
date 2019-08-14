import { expect } from 'chai'
import { graphql, GraphQLSchema } from 'graphql'
import { maskErrors } from 'graphql-errors'
import { withMockedUuid } from './testUuid'
import { withMockedDate } from './testDate'

export interface Test {
	schema: GraphQLSchema
	context: any
	query: string
	queryVariables?: Record<string, any>
	return: object
}

export const executeGraphQlTest = async (test: Test) => {
	maskErrors(test.schema, error => {
		return error
	})

	await withMockedUuid(() =>
		withMockedDate(async () => {
			const response = await graphql(test.schema, test.query, null, test.context, test.queryVariables)
			if ('errors' in response) {
				console.error((response.errors as any)[0])
				response.errors = (response.errors as any).map(({ message }: any) => ({ message }))
			}
			console.log(response)
			expect(response).deep.equal(test.return)
		}),
	)
}

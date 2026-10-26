import { createLogger, NullLoggerHandler, withLogger } from '@contember/logger'
import { ExecutionResult, graphql, GraphQLSchema, parse } from 'graphql'
import { execute as executeJson, validate as validateJson } from '@contember/graphql-json'
import { expect } from 'bun:test'
import { Context, JsonContentSchema } from '../../src/index.js'

export interface Test {
	schema: GraphQLSchema | JsonContentSchema
	context: Context
	query: string
	queryVariables?: Record<string, any>
	return: object
}

/** Which engine `execute()` in `test.ts` runs the content schema on; `json` runs the whole suite on `@contember/graphql-json`. */
export const contentGraphQlEngine: 'graphql-js' | 'json' = process.env.CONTENT_GRAPHQL_ENGINE === 'json' ? 'json' : 'graphql-js'

const executeOnEngine = async (test: Test): Promise<Pick<ExecutionResult, 'data' | 'errors'>> => {
	if (test.schema instanceof GraphQLSchema) {
		return await graphql({
			schema: test.schema,
			source: test.query,
			contextValue: test.context,
			variableValues: test.queryVariables,
		})
	}
	const document = parse(test.query)
	const validationErrors = validateJson(test.schema.schema, document, { scalars: test.schema.scalars })
	if (validationErrors.length > 0) {
		return { errors: validationErrors }
	}
	return await executeJson({
		schema: test.schema.schema,
		document,
		resolvers: test.schema.resolvers,
		scalars: test.schema.scalars,
		contextValue: test.context,
		variableValues: test.queryVariables,
	})
}

export const executeGraphQlTest = async (test: Test) => {
	const logger = createLogger(new NullLoggerHandler())
	const rawResponse = await withLogger(logger, () => executeOnEngine(test))
	if ('errors' in rawResponse) {
		if (rawResponse.errors?.length === 1 && (rawResponse.errors as any)[0].originalError) {
			throw (rawResponse.errors as any)[0].originalError
		}
		rawResponse.errors = (rawResponse.errors as any).map(({ message }: any) => ({ message }))
	}
	const response = JSON.parse(JSON.stringify(rawResponse))
	expect(response).toStrictEqual(test.return)
}

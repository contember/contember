import { createLogger, NullLoggerHandler, withLogger } from '@contember/logger'
import { ExecutionResult, graphql, GraphQLSchema, parse } from 'graphql'
import { execute as executeJson, validate as validateJson } from '@contember/graphql-json'
import { expect } from 'bun:test'
import { Context, JsonContentSchema } from '../../src/index.js'

export type GraphQlTestSchema =
	| { engine: 'graphql-js'; schema: GraphQLSchema }
	| { engine: 'graphql-json'; schema: JsonContentSchema }

export interface GraphQlTestRun {
	schema: GraphQlTestSchema
	context: Context
	query: string
	queryVariables?: Record<string, any>
}

const executeOnEngine = async ({ schema, context, query, queryVariables }: GraphQlTestRun): Promise<ExecutionResult> => {
	if (schema.engine === 'graphql-js') {
		return await graphql({ schema: schema.schema, source: query, contextValue: context, variableValues: queryVariables })
	}
	const document = parse(query)
	const { schema: jsonSchema, resolvers, scalars } = schema.schema
	const validationErrors = validateJson(jsonSchema, document, { scalars })
	if (validationErrors.length > 0) {
		return { errors: validationErrors }
	}
	return await executeJson({ schema: jsonSchema, document, resolvers, scalars, contextValue: context, variableValues: queryVariables })
}

export const runGraphQlTest = async (test: GraphQlTestRun): Promise<ExecutionResult> =>
	await withLogger(createLogger(new NullLoggerHandler()), () => executeOnEngine(test))

/** The response as a client receives it, plus the class and message of each error's cause, which the response does not carry. */
export const serializeGraphQlResult = (result: ExecutionResult): string =>
	JSON.stringify({
		response: result,
		causes: result.errors?.map(it => it.originalError ? [it.originalError.constructor.name, it.originalError.message] : null),
	})

/** The response with errors reduced to their messages. */
export const normalizeGraphQlResult = (rawResponse: ExecutionResult): unknown =>
	JSON.parse(JSON.stringify(rawResponse.errors ? { ...rawResponse, errors: rawResponse.errors.map(({ message }) => ({ message })) } : rawResponse))

/** A single error with a cause is rethrown, so a test can expect the cause itself. */
export const assertGraphQlTestResult = (rawResponse: ExecutionResult, expected: object) => {
	if (rawResponse.errors) {
		const originalError = rawResponse.errors.length === 1 ? rawResponse.errors[0].originalError : undefined
		if (originalError) {
			throw originalError
		}
	}
	expect(normalizeGraphQlResult(rawResponse)).toStrictEqual(expected)
}

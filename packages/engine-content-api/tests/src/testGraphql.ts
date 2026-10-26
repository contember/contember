import { createLogger, NullLoggerHandler, withLogger } from '@contember/logger'
import { ExecutionResult, parse } from 'graphql'
import { execute as executeJson, validate as validateJson } from '@contember/graphql-json'
import { expect } from 'bun:test'
import { Context, JsonContentSchema } from '../../src/index.js'

export interface Test {
	schema: JsonContentSchema
	context: Context
	query: string
	queryVariables?: Record<string, any>
	return: object
}

const executeOnEngine = async (test: Test): Promise<Pick<ExecutionResult, 'data' | 'errors'>> => {
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

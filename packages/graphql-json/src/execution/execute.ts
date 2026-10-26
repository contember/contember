/**
 * Main execute function
 */

import { GraphQLError } from 'graphql'
import type { FieldNode } from 'graphql'
import type { ExecuteArgs, ExecutionContext, ExecutionResult } from '../types/execution.js'
import { buildExecutionContext, getOperationRootTypeName, isExecutionContextErrors } from './context.js'
import { collectFields } from './collectFields.js'
import { executeFields } from './fields.js'
import { isPromise, promiseReduce } from '../utils/helpers.js'

/**
 * Execute a GraphQL query
 */
export function execute(args: ExecuteArgs): ExecutionResult | Promise<ExecutionResult> {
	// Build execution context
	const contextOrErrors = buildExecutionContext(args)

	// Check for errors during context building
	if (isExecutionContextErrors(contextOrErrors)) {
		return { errors: contextOrErrors }
	}

	const exeContext = contextOrErrors

	// Execute the operation with error handling for non-null propagation
	try {
		const result = executeOperation(exeContext)

		if (isPromise(result)) {
			return result
				.then((data) => buildResponse(exeContext, data))
				.catch((error) => {
					// Handle errors that propagate from non-null fields
					if (error instanceof GraphQLError) {
						exeContext.errors.push(error)
					} else {
						exeContext.errors.push(new GraphQLError(error.message, { originalError: error }))
					}
					return buildResponse(exeContext, null)
				})
		}

		return buildResponse(exeContext, result)
	} catch (error) {
		// Handle errors that propagate from non-null fields
		if (error instanceof GraphQLError) {
			exeContext.errors.push(error)
		} else if (error instanceof Error) {
			exeContext.errors.push(new GraphQLError(error.message, { originalError: error }))
		}
		return buildResponse(exeContext, null)
	}
}

/**
 * Execute synchronously (throws if async resolvers encountered)
 */
export function executeSync(args: ExecuteArgs): ExecutionResult {
	const result = execute(args)

	if (isPromise(result)) {
		throw new Error('GraphQL execution failed to complete synchronously.')
	}

	return result
}

/**
 * Execute the operation
 */
function executeOperation(
	exeContext: ExecutionContext,
): Record<string, unknown> | Promise<Record<string, unknown>> | null {
	const { schema, operation, rootValue } = exeContext

	// Get root type
	const rootTypeName = getOperationRootTypeName(schema, operation)
	if (!rootTypeName) {
		const error = new GraphQLError(
			`Schema is not configured to execute ${operation.operation} operation.`,
			{ nodes: operation },
		)
		exeContext.errors.push(error)
		return null
	}

	const rootType = schema.t[rootTypeName]
	if (!rootType || rootType[0] !== 1 /* TypeKind.OBJECT */) {
		const error = new GraphQLError(
			`Schema root type "${rootTypeName}" is not an object type.`,
			{ nodes: operation },
		)
		exeContext.errors.push(error)
		return null
	}

	// Collect root fields
	const rootFields = collectFields(
		schema,
		exeContext.fragments,
		exeContext.variableValues,
		rootTypeName,
		operation.selectionSet,
	)

	// Execute based on operation type
	const path = undefined

	switch (operation.operation) {
		case 'query':
			return executeFields(exeContext, rootTypeName, rootValue, path, rootFields)

		case 'mutation':
			return executeFieldsSerially(exeContext, rootTypeName, rootValue, path, rootFields)

		case 'subscription':
			// Subscription not implemented in POC
			const error = new GraphQLError('Subscription operation is not supported.')
			exeContext.errors.push(error)
			return null

		default:
			const unknownError = new GraphQLError(`Unknown operation type: ${operation.operation}`)
			exeContext.errors.push(unknownError)
			return null
	}
}

/**
 * Execute fields serially (for mutations)
 */
function executeFieldsSerially(
	exeContext: ExecutionContext,
	parentTypeName: string,
	sourceValue: unknown,
	path: undefined,
	groupedFieldSet: Map<string, readonly FieldNode[]>,
): Record<string, unknown> | Promise<Record<string, unknown>> {
	const entries = Array.from(groupedFieldSet.entries())

	return promiseReduce(
		entries,
		async (results, [responseName, fieldNodes]) => {
			// Create a single-field grouped set
			const singleFieldSet = new Map([[responseName, fieldNodes]])
			const fieldResults = executeFields(
				exeContext,
				parentTypeName,
				sourceValue,
				path,
				singleFieldSet,
			)

			const resolved = isPromise(fieldResults) ? await fieldResults : fieldResults
			return { ...results, ...resolved }
		},
		{} as Record<string, unknown>,
	)
}

/**
 * Build final response
 */
function buildResponse(
	exeContext: ExecutionContext,
	data: Record<string, unknown> | null,
): ExecutionResult {
	const result: ExecutionResult = {}

	if (exeContext.errors.length > 0) {
		result.errors = exeContext.errors
	}

	result.data = data

	return result
}

/**
 * Main execute function
 */

import { GraphQLError, locatedError } from 'graphql'
import type { FieldNode } from 'graphql'
import type { ExecuteArgs, ExecuteArgsWithContext, ExecutionContext, ExecutionResult } from '../types/execution.js'
import { buildExecutionContext, getOperationRootTypeName, isExecutionContextErrors } from './context.js'
import { collectFields } from './collectFields.js'
import { addError, executeFields } from './fields.js'
import { getOwn, isPromise, promiseReduce } from '../utils/helpers.js'

/**
 * Execute a GraphQL query. Resolvers typed for a context must be given a `contextValue`.
 */
export function execute(args: ExecuteArgs<undefined>): ExecutionResult | Promise<ExecutionResult>
export function execute<TContext>(args: ExecuteArgsWithContext<TContext>): ExecutionResult | Promise<ExecutionResult>
export function execute<TContext>(
	args: ExecuteArgsWithContext<TContext> | ExecuteArgs<undefined>,
): ExecutionResult | Promise<ExecutionResult> {
	return executeEither(args)
}

function executeEither<TContext>(
	args: ExecuteArgsWithContext<TContext> | ExecuteArgs<undefined>,
): ExecutionResult | Promise<ExecutionResult> {
	if (hasContextValue(args)) {
		return executeWithContext(args)
	}
	return executeWithContext({ ...args, contextValue: undefined })
}

// Only ExecuteArgsWithContext can carry a defined contextValue. An undefined one taken as ExecuteArgs<undefined> is
// still passed correctly: if it came from ExecuteArgsWithContext<TContext>, then TContext admits undefined.
function hasContextValue<TContext>(
	args: ExecuteArgsWithContext<TContext> | ExecuteArgs<undefined>,
): args is ExecuteArgsWithContext<TContext> {
	return args.contextValue !== undefined
}

function executeWithContext<TContext>(args: ExecuteArgsWithContext<TContext>): ExecutionResult | Promise<ExecutionResult> {
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
			return result.then(
				(data) => buildResponse(exeContext, data),
				(error) => {
					addError(exeContext, toGraphQLError(error), undefined)
					return buildResponse(exeContext, null)
				},
			)
		}

		return buildResponse(exeContext, result)
	} catch (error) {
		// an error propagated from a non-null root field nulls the whole data
		addError(exeContext, toGraphQLError(error), undefined)
		return buildResponse(exeContext, null)
	}
}

/** Errors propagated to the root are located field errors; anything else is wrapped so it still reaches the response */
function toGraphQLError(error: unknown): GraphQLError {
	return error instanceof GraphQLError ? error : locatedError(error, undefined, undefined)
}

/**
 * Execute synchronously (throws if async resolvers encountered)
 */
export function executeSync(args: ExecuteArgs<undefined>): ExecutionResult
export function executeSync<TContext>(args: ExecuteArgsWithContext<TContext>): ExecutionResult
export function executeSync<TContext>(args: ExecuteArgsWithContext<TContext> | ExecuteArgs<undefined>): ExecutionResult {
	const result = executeEither(args)

	if (isPromise(result)) {
		throw new Error('GraphQL execution failed to complete synchronously.')
	}

	return result
}

/**
 * Execute the operation
 */
function executeOperation<TContext>(
	exeContext: ExecutionContext<TContext>,
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

	const rootType = getOwn(schema.t, rootTypeName)
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
function executeFieldsSerially<TContext>(
	exeContext: ExecutionContext<TContext>,
	parentTypeName: string,
	sourceValue: unknown,
	path: undefined,
	groupedFieldSet: Map<string, readonly FieldNode[]>,
): Record<string, unknown> | Promise<Record<string, unknown>> {
	const entries = Array.from(groupedFieldSet.entries())

	return promiseReduce<[string, readonly FieldNode[]], Record<string, unknown>>(
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
		{},
	)
}

/**
 * Build final response
 */
function buildResponse<TContext>(
	exeContext: ExecutionContext<TContext>,
	data: Record<string, unknown> | null,
): ExecutionResult {
	const result: ExecutionResult = {}

	if (exeContext.errors.length > 0) {
		result.errors = exeContext.errors
	}

	result.data = data

	return result
}

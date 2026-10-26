/**
 * Execution context building
 */

import { GraphQLError, Kind } from 'graphql'
import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { ExecuteArgsWithContext, ExecutionContext } from '../types/execution.js'
import { defaultFieldResolver } from '../types/resolvers.js'
import { withBuiltInScalars } from '../scalars/builtIn.js'
import { coerceVariableValues } from './values.js'
import { getSchemaWithIntrospection } from '../introspection/types.js'

/**
 * Type guard for checking if result is errors array; the other variant `T` is never an array
 */
export function isExecutionContextErrors<T>(
	result: T | readonly GraphQLError[],
): result is readonly GraphQLError[] {
	return Array.isArray(result)
}

/**
 * Build execution context from arguments
 */
export function buildExecutionContext<TContext>(
	args: ExecuteArgsWithContext<TContext>,
): ExecutionContext<TContext> | readonly GraphQLError[] {
	const {
		schema,
		document,
		resolvers,
		rootValue,
		contextValue,
		variableValues,
		operationName,
		scalars,
		typeResolvers,
		isTypeOfResolvers,
		fieldResolver,
	} = args

	// Extract fragments and select the operation the same way graphql-js does
	const fragments: Record<string, FragmentDefinitionNode> = {}
	let operation: OperationDefinitionNode | undefined

	for (const definition of document.definitions) {
		if (definition.kind === Kind.OPERATION_DEFINITION) {
			if (operationName == null) {
				if (operation !== undefined) {
					return [new GraphQLError('Must provide operation name if query contains multiple operations.')]
				}
				operation = definition
			} else if (definition.name?.value === operationName) {
				operation = definition
			}
		} else if (definition.kind === Kind.FRAGMENT_DEFINITION) {
			fragments[definition.name.value] = definition
		}
	}

	if (!operation) {
		if (operationName != null) {
			return [new GraphQLError(`Unknown operation named "${operationName}".`)]
		}
		return [new GraphQLError('Must provide an operation.')]
	}

	const mergedScalars = withBuiltInScalars(scalars)

	// Coerce variable values according to GraphQL spec
	const coercedVariableValues = coerceVariableValues(
		schema,
		operation,
		variableValues ?? {},
		mergedScalars,
	)

	if (isExecutionContextErrors(coercedVariableValues)) {
		return coercedVariableValues
	}

	return {
		schema: getSchemaWithIntrospection(schema),
		fragments,
		rootValue,
		contextValue,
		operation,
		variableValues: coercedVariableValues,
		resolvers: resolvers ?? {},
		typeResolvers: typeResolvers ?? {},
		isTypeOfResolvers: isTypeOfResolvers ?? {},
		scalars: mergedScalars,
		fieldResolver: fieldResolver ?? defaultFieldResolver,
		errors: [],
	}
}

/**
 * Get root type name for operation
 */
export function getOperationRootTypeName(
	schema: { q: string; m: string | null; s: string | null },
	operation: OperationDefinitionNode,
): string | null {
	switch (operation.operation) {
		case 'query':
			return schema.q
		case 'mutation':
			return schema.m
		case 'subscription':
			return schema.s
		default:
			return null
	}
}

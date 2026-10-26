/**
 * Execution context building
 */

import { GraphQLError, Kind } from 'graphql'
import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { ExecuteArgs, ExecutionContext } from '../types/execution.js'
import { defaultFieldResolver } from '../types/resolvers.js'
import { withBuiltInScalars } from '../scalars/builtIn.js'
import { coerceVariableValues } from './values.js'
import { getSchemaWithIntrospection } from '../introspection/types.js'
import { getResolversWithIntrospection } from './introspectionResolvers.js'

/**
 * Type guard for checking if result is errors array
 */
export function isExecutionContextErrors(
	result: ExecutionContext | readonly GraphQLError[],
): result is readonly GraphQLError[] {
	return Array.isArray(result)
}

/**
 * Build execution context from arguments
 */
export function buildExecutionContext(
	args: ExecuteArgs,
): ExecutionContext | readonly GraphQLError[] {
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

	// Extract fragments and operations from document
	const fragments: Record<string, FragmentDefinitionNode> = {}
	const operations: OperationDefinitionNode[] = []

	for (const definition of document.definitions) {
		if (definition.kind === Kind.OPERATION_DEFINITION) {
			operations.push(definition)
		} else if (definition.kind === Kind.FRAGMENT_DEFINITION) {
			fragments[definition.name.value] = definition
		}
	}

	// Select operation
	let operation: OperationDefinitionNode | undefined

	if (operationName) {
		operation = operations.find((op) => op.name?.value === operationName)
		if (!operation) {
			return [
				new GraphQLError(`Unknown operation named "${operationName}".`),
			]
		}
	} else if (operations.length === 1) {
		operation = operations[0]
	} else if (operations.length === 0) {
		return [new GraphQLError('Must provide an operation.')]
	} else {
		return [
			new GraphQLError(
				'Must provide operation name if query contains multiple operations.',
			),
		]
	}

	const mergedScalars = withBuiltInScalars(scalars)

	// Coerce variable values according to GraphQL spec
	const coercedVariableValues = coerceVariableValues(
		schema,
		operation,
		variableValues ?? {},
		mergedScalars,
	)

	if (Array.isArray(coercedVariableValues)) {
		return coercedVariableValues
	}

	return {
		schema: getSchemaWithIntrospection(schema),
		fragments,
		rootValue,
		contextValue,
		operation,
		variableValues: coercedVariableValues as Record<string, unknown>,
		resolvers: getResolversWithIntrospection(resolvers),
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

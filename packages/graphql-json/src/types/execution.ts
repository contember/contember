/**
 * Execution types
 */

import type { DocumentNode, FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { Schema } from './schema.js'
import type { IsTypeOfResolverMap, ResolverFn, ResolverMap, ScalarMap, TypeResolverMap } from './resolvers.js'
import type { GraphQLError } from 'graphql'

/**
 * Execution context - data available during query execution
 */
export interface ExecutionContext {
	schema: Schema
	fragments: Record<string, FragmentDefinitionNode>
	rootValue: unknown
	contextValue: unknown
	operation: OperationDefinitionNode
	variableValues: Record<string, unknown>

	// External configuration
	resolvers: ResolverMap
	typeResolvers: TypeResolverMap
	isTypeOfResolvers: IsTypeOfResolverMap
	scalars: ScalarMap

	// Fallback resolver
	fieldResolver: ResolverFn

	// Error collection
	errors: GraphQLError[]
}

/**
 * Arguments for execute function
 */
export interface ExecuteArgs {
	schema: Schema
	document: DocumentNode

	// External resolvers; types without an entry fall back to fieldResolver
	resolvers?: ResolverMap

	// Optional
	rootValue?: unknown
	contextValue?: unknown
	variableValues?: Record<string, unknown>
	operationName?: string

	// Custom scalars
	scalars?: ScalarMap

	// Type resolvers for Union/Interface
	typeResolvers?: TypeResolverMap

	// isTypeOf resolvers for concrete types
	isTypeOfResolvers?: IsTypeOfResolverMap

	// Fallback resolver
	fieldResolver?: ResolverFn
}

/**
 * Execution result
 */
export interface ExecutionResult<TData = Record<string, unknown>> {
	data?: TData | null
	errors?: readonly GraphQLError[]
}

/**
 * Formatted execution result (for serialization)
 */
export interface FormattedExecutionResult<TData = Record<string, unknown>> {
	data?: TData | null
	errors?: readonly {
		message: string
		locations?: readonly { line: number; column: number }[]
		path?: readonly (string | number)[]
		extensions?: Record<string, unknown>
	}[]
}

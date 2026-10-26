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
export interface ExecutionContext<TContext = unknown> {
	schema: Schema
	fragments: Record<string, FragmentDefinitionNode>
	rootValue: unknown
	contextValue: TContext
	operation: OperationDefinitionNode
	variableValues: Record<string, unknown>

	// External configuration
	resolvers: ResolverMap<TContext>
	typeResolvers: TypeResolverMap<TContext>
	isTypeOfResolvers: IsTypeOfResolverMap<TContext>
	scalars: ScalarMap

	// Fallback resolver
	fieldResolver: ResolverFn<unknown, TContext>

	// Error collection
	errors: GraphQLError[]
}

/**
 * Arguments for execute function
 */
export interface ExecuteArgs<TContext = unknown> {
	schema: Schema
	document: DocumentNode

	// External resolvers; types without an entry fall back to fieldResolver
	resolvers?: ResolverMap<TContext>

	// Optional
	rootValue?: unknown
	contextValue?: TContext
	variableValues?: Record<string, unknown>
	operationName?: string

	// Custom scalars
	scalars?: ScalarMap

	// Type resolvers for Union/Interface
	typeResolvers?: TypeResolverMap<TContext>

	// isTypeOf resolvers for concrete types
	isTypeOfResolvers?: IsTypeOfResolverMap<TContext>

	// Fallback resolver
	fieldResolver?: ResolverFn<unknown, TContext>
}

/**
 * Execute arguments whose context value is present, so resolvers typed for `TContext` never receive `undefined`
 */
export interface ExecuteArgsWithContext<TContext> extends ExecuteArgs<TContext> {
	contextValue: TContext
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

/**
 * Resolver type definitions
 */

import type { FieldNode, FragmentDefinitionNode, OperationDefinitionNode, ValueNode } from 'graphql'
import type { Schema, TypeRef } from './schema.js'
import type { Path } from '../utils/path.js'
import { isObjectLike } from '../utils/helpers.js'

/**
 * Resolve info passed to resolvers
 */
export interface ResolveInfo {
	fieldName: string
	fieldNodes: readonly FieldNode[]
	returnType: TypeRef
	parentType: string
	path: Path
	schema: Schema
	fragments: Record<string, FragmentDefinitionNode>
	rootValue: unknown
	operation: OperationDefinitionNode
	variableValues: Record<string, unknown>
	/** The variables as the request gave them, before coercion; for delegating the field to another executor */
	rawVariableValues: Record<string, unknown>
}

/**
 * Resolver function signature
 */
export type ResolverFn<
	TSource = unknown,
	TContext = unknown,
	TArgs = Record<string, unknown>,
	TResult = unknown,
> = (
	source: TSource,
	args: TArgs,
	context: TContext,
	info: ResolveInfo,
) => TResult | Promise<TResult>

/**
 * Nested resolver map
 * { TypeName: { fieldName: resolverFn } }
 */
export type ResolverMap<TContext = unknown> = {
	[typeName: string]: {
		[fieldName: string]: ResolverFn<unknown, TContext, Record<string, unknown>, unknown>
	}
}

/**
 * Type resolver function for abstract types (Union/Interface)
 */
export type TypeResolverFn<TContext = unknown> = (
	value: unknown,
	context: TContext,
	info: ResolveInfo,
	abstractType: { name: string; kind: number },
) => string | null | undefined | Promise<string | null | undefined>

/**
 * Type resolver map
 * { AbstractTypeName: typeResolverFn }
 */
export type TypeResolverMap<TContext = unknown> = {
	[typeName: string]: TypeResolverFn<TContext>
}

/**
 * isTypeOf function for concrete object types
 * Returns true if the value is of this type
 */
export type IsTypeOfResolverFn<TContext = unknown> = (
	value: unknown,
	context: TContext,
	info: ResolveInfo,
) => boolean | Promise<boolean>

/**
 * isTypeOf resolver map
 * { ObjectTypeName: isTypeOfFn }
 */
export type IsTypeOfResolverMap<TContext = unknown> = {
	[typeName: string]: IsTypeOfResolverFn<TContext>
}

/**
 * Scalar type implementation
 */
export interface ScalarImplementation {
	serialize: (value: unknown) => unknown
	parseValue: (value: unknown) => unknown
	parseLiteral: (valueNode: ValueNode, variables?: Record<string, unknown> | null) => unknown
}

/**
 * Scalar map
 * { ScalarName: ScalarImplementation }
 */
export type ScalarMap = {
	[scalarName: string]: ScalarImplementation
}

/**
 * Default field resolver
 */
export const defaultFieldResolver: ResolverFn = (source, args, context, info) => {
	if (isObjectLike(source)) {
		const value = source[info.fieldName]
		// a method is called on its source with the field arguments, as in graphql-js
		if (typeof value === 'function') {
			return value.call(source, args, context, info)
		}
		return value
	}
	return undefined
}

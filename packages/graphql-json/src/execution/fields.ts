/**
 * Field execution
 */

import { GraphQLError } from 'graphql'
import type { FieldNode } from 'graphql'
import type { ExecutionContext } from '../types/execution.js'
import type { Field, ObjectType } from '../types/schema.js'
import { F, TypeKind } from '../types/schema.js'
import type { ResolveInfo, ResolverFn } from '../types/resolvers.js'
import type { Path } from '../utils/path.js'
import { addPath, pathToArray } from '../utils/path.js'
import { isPromise, promiseForObject } from '../utils/helpers.js'
import { isNonNullType } from '../utils/typeRef.js'
import { completeValue } from './complete.js'
import { getArgumentValues } from './values.js'
import type { GroupedFieldSet } from './collectFields.js'
import { introspectionResolvers, resolveSchema, resolveType } from './introspectionResolvers.js'
import { isIntrospectionType } from '../introspection/types.js'

/**
 * Execute collected fields
 */
export function executeFields<TContext>(
	exeContext: ExecutionContext<TContext>,
	parentTypeName: string,
	sourceValue: unknown,
	path: Path | undefined,
	groupedFieldSet: GroupedFieldSet,
): Record<string, unknown> | Promise<Record<string, unknown>> {
	const results: Record<string, unknown> = {}
	let containsPromise = false

	for (const [responseName, fieldNodes] of groupedFieldSet) {
		const fieldPath = addPath(path, responseName, parentTypeName)
		const result = executeField(
			exeContext,
			parentTypeName,
			sourceValue,
			fieldNodes,
			fieldPath,
		)

		if (result !== undefined) {
			results[responseName] = result
			if (isPromise(result)) {
				containsPromise = true
			}
		}
	}

	if (containsPromise) {
		return promiseForObject(results)
	}

	return results
}

/**
 * Execute a single field
 */
function executeField<TContext>(
	exeContext: ExecutionContext<TContext>,
	parentTypeName: string,
	sourceValue: unknown,
	fieldNodes: readonly FieldNode[],
	path: Path,
): unknown {
	const fieldNode = fieldNodes[0]
	const fieldName = fieldNode.name.value

	// Get field definition
	const parentType = exeContext.schema.t[parentTypeName] as ObjectType | undefined
	if (!parentType || parentType[0] !== TypeKind.OBJECT) {
		return undefined
	}

	// ObjectType: [kind, fields, interfaces, description?]
	const fields = parentType[1]
	const fieldDef = fields[fieldName]
	if (!fieldDef) {
		// Handle __typename meta-field
		if (fieldName === '__typename') {
			return parentTypeName
		}

		// Handle __schema meta-field (only on root Query type)
		if (fieldName === '__schema' && parentTypeName === exeContext.schema.q) {
			const schemaData = resolveSchema(exeContext.schema)
			const schemaTypeRef: [number, string] = [1, '__Schema'] // __Schema! (NonNull)
			const info = buildResolveInfo(
				exeContext,
				fieldName,
				[[1, '__Schema'], null] as Field,
				fieldNodes,
				parentTypeName,
				path,
			)
			return completeValue(exeContext, schemaTypeRef, fieldNodes, info, path, schemaData)
		}

		// Handle __type(name: String!) meta-field (only on root Query type)
		if (fieldName === '__type' && parentTypeName === exeContext.schema.q) {
			// Get the 'name' argument from the field
			const nameArg = fieldNode.arguments?.find((arg) => arg.name.value === 'name')
			let typeName: string | null = null
			if (nameArg && nameArg.value.kind === 'StringValue') {
				typeName = nameArg.value.value
			} else if (nameArg && nameArg.value.kind === 'Variable') {
				typeName = exeContext.variableValues[nameArg.value.name.value] as string
			}

			const typeData = typeName ? resolveType(exeContext.schema, typeName) : null
			const typeTypeRef: [number, string] = [0, '__Type'] // __Type (nullable)
			const info = buildResolveInfo(
				exeContext,
				fieldName,
				[[0, '__Type'], { name: [[1, 'String']] }] as Field,
				fieldNodes,
				parentTypeName,
				path,
			)
			return completeValue(exeContext, typeTypeRef, fieldNodes, info, path, typeData)
		}

		return undefined
	}

	const returnTypeRef = F.type(fieldDef)

	// Get resolver
	const resolver = getFieldResolver(exeContext, parentTypeName, fieldName)

	// Build resolve info
	const info = buildResolveInfo(exeContext, fieldName, fieldDef, fieldNodes, parentTypeName, path)

	try {
		// Get argument values
		const args = getArgumentValues(
			exeContext.schema,
			fieldDef,
			fieldNode,
			exeContext.variableValues,
			exeContext.scalars,
		)

		// Resolve the field
		const result = resolveFieldValueSafe(exeContext, resolver, sourceValue, args, info)

		// Complete the value
		let completed
		if (isPromise(result)) {
			completed = result.then((resolved) => completeValue(exeContext, returnTypeRef, fieldNodes, info, path, resolved))
		} else {
			completed = completeValue(exeContext, returnTypeRef, fieldNodes, info, path, result)
		}

		if (isPromise(completed)) {
			return completed.then(undefined, (rawError) => {
				const error = rawError instanceof Error ? rawError : new Error(String(rawError))
				return handleFieldError(error, returnTypeRef, fieldNodes, path, exeContext)
			})
		}

		return completed
	} catch (rawError) {
		const error = rawError instanceof Error ? rawError : new Error(String(rawError))
		return handleFieldError(error, returnTypeRef, fieldNodes, path, exeContext)
	}
}

/**
 * Get resolver for a field
 */
function getFieldResolver<TContext>(
	exeContext: ExecutionContext<TContext>,
	typeName: string,
	fieldName: string,
): ResolverFn<unknown, TContext> {
	// introspection resolvers take precedence for the reserved __ types
	const typeResolvers = (isIntrospectionType(typeName) ? introspectionResolvers[typeName] : undefined) ?? exeContext.resolvers[typeName]
	if (typeResolvers) {
		const fieldResolver = typeResolvers[fieldName]
		if (fieldResolver) {
			return fieldResolver
		}
	}
	return exeContext.fieldResolver
}

/**
 * Build ResolveInfo object
 */
function buildResolveInfo<TContext>(
	exeContext: ExecutionContext<TContext>,
	fieldName: string,
	fieldDef: Field,
	fieldNodes: readonly FieldNode[],
	parentTypeName: string,
	path: Path,
): ResolveInfo {
	return {
		fieldName,
		fieldNodes,
		returnType: F.type(fieldDef),
		parentType: parentTypeName,
		path,
		schema: exeContext.schema,
		fragments: exeContext.fragments,
		rootValue: exeContext.rootValue,
		operation: exeContext.operation,
		variableValues: exeContext.variableValues,
	}
}

/**
 * Resolve field value (call resolver) - does not catch errors
 * Errors are caught at the executeField level for proper null propagation
 */
function resolveFieldValueSafe<TContext>(
	exeContext: ExecutionContext<TContext>,
	resolver: ResolverFn<unknown, TContext>,
	source: unknown,
	args: Record<string, unknown>,
	info: ResolveInfo,
): unknown {
	return resolver(source, args, exeContext.contextValue, info)
}

/**
 * Handle field error - either propagate (for non-null) or collect (for nullable)
 * Returns null for nullable types, throws for non-null types
 */
export function handleFieldError<TContext>(
	rawError: Error,
	returnTypeRef: [number, string],
	fieldNodes: readonly FieldNode[],
	path: Path,
	exeContext: ExecutionContext<TContext>,
): null {
	// Create or enhance the GraphQLError with proper path
	let error: GraphQLError
	if (rawError instanceof GraphQLError) {
		// If the error already has a path, preserve it; otherwise add the current path
		if (rawError.path) {
			error = rawError
		} else {
			// Create a new error with the path
			error = new GraphQLError(rawError.message, {
				nodes: rawError.nodes ?? fieldNodes,
				path: pathToArray(path),
				originalError: rawError.originalError ?? undefined,
			})
		}
	} else {
		error = new GraphQLError(rawError.message, {
			nodes: fieldNodes,
			path: pathToArray(path),
			originalError: rawError,
		})
	}

	// If the field type is non-null, then error propagates up
	if (isNonNullType(returnTypeRef[0])) {
		throw error
	}

	// Otherwise, error protection is applied - log error and return null
	exeContext.errors.push(error)
	return null
}

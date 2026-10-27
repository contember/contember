/**
 * Field execution
 */

import { type GraphQLError, locatedError } from 'graphql'
import type { FieldNode } from 'graphql'
import type { ExecutionContext } from '../types/execution.js'
import type { Field, TypeRef } from '../types/schema.js'
import { F, TypeKind, TypePattern } from '../types/schema.js'
import type { ResolveInfo, ResolverFn } from '../types/resolvers.js'
import type { Path } from '../utils/path.js'
import { addPath, pathToArray } from '../utils/path.js'
import { getOwn, isPromise, promiseForObject, setOwn } from '../utils/helpers.js'
import { isNonNullType } from '../utils/typeRef.js'
import { completeValue } from './complete.js'
import { getArgumentValues } from './values.js'
import type { GroupedFieldSet } from './collectFields.js'
import { introspectionResolvers, resolveSchema, resolveType } from './introspectionResolvers.js'
import { isIntrospectionType } from '../introspection/types.js'

const schemaMetaField: Field = [[TypePattern.T_NN, '__Schema'], null]
const typeMetaField: Field = [[TypePattern.T, '__Type'], { name: [[TypePattern.T_NN, 'String']] }]

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
			setOwn(results, responseName, result)
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
export function executeField<TContext>(
	exeContext: ExecutionContext<TContext>,
	parentTypeName: string,
	sourceValue: unknown,
	fieldNodes: readonly FieldNode[],
	path: Path,
): unknown {
	const fieldNode = fieldNodes[0]
	const fieldName = fieldNode.name.value

	// Get field definition
	const parentType = getOwn(exeContext.schema.t, parentTypeName)
	if (!parentType || parentType[0] !== TypeKind.OBJECT) {
		return undefined
	}

	// ObjectType: [kind, fields, interfaces, description?]
	const fieldDef = getOwn(parentType[1], fieldName)
	if (!fieldDef) {
		// Handle __typename meta-field
		if (fieldName === '__typename') {
			return parentTypeName
		}

		// Handle __schema meta-field (only on root Query type)
		if (fieldName === '__schema' && parentTypeName === exeContext.schema.q) {
			const schemaData = resolveSchema(exeContext.schema)
			const info = buildResolveInfo(exeContext, fieldName, schemaMetaField, fieldNodes, parentTypeName, path)
			return completeValue(exeContext, F.type(schemaMetaField), fieldNodes, info, path, schemaData)
		}

		// Handle __type(name: String!) meta-field (only on root Query type)
		if (fieldName === '__type' && parentTypeName === exeContext.schema.q) {
			// Get the 'name' argument from the field
			const nameArg = fieldNode.arguments?.find((arg) => arg.name.value === 'name')
			let typeName: string | null = null
			if (nameArg && nameArg.value.kind === 'StringValue') {
				typeName = nameArg.value.value
			} else if (nameArg && nameArg.value.kind === 'Variable') {
				const variableValue = getOwn(exeContext.variableValues, nameArg.value.name.value)
				// a validated document passes a String! variable here; anything else finds no type
				typeName = typeof variableValue === 'string' ? variableValue : null
			}

			const typeData = typeName ? resolveType(exeContext.schema, typeName) : null
			const info = buildResolveInfo(exeContext, fieldName, typeMetaField, fieldNodes, parentTypeName, path)
			return completeValue(exeContext, F.type(typeMetaField), fieldNodes, info, path, typeData)
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
			return completed.then(undefined, (rawError) => handleFieldError(rawError, returnTypeRef, fieldNodes, path, exeContext))
		}

		return completed
	} catch (rawError) {
		return handleFieldError(rawError, returnTypeRef, fieldNodes, path, exeContext)
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
	const typeResolvers = (isIntrospectionType(typeName) ? getOwn(introspectionResolvers, typeName) : undefined)
		?? getOwn(exeContext.resolvers, typeName)
	if (typeResolvers) {
		const fieldResolver = getOwn(typeResolvers, fieldName)
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
		rawVariableValues: exeContext.rawVariableValues,
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
 * Locate the error at the field as graphql-js does, then propagate it (non-null) or collect it and return null (nullable)
 */
export function handleFieldError<TContext>(
	rawError: unknown,
	returnTypeRef: TypeRef,
	fieldNodes: readonly FieldNode[],
	path: Path,
	exeContext: ExecutionContext<TContext>,
): null {
	const error = locatedError(rawError, fieldNodes, pathToArray(path))

	if (isNonNullType(returnTypeRef[0])) {
		throw error
	}

	addError(exeContext, error, path)
	return null
}

/**
 * Collect an error unless its position or an ancestor was already nulled by another error, as graphql-js does
 */
export function addError<TContext>(exeContext: ExecutionContext<TContext>, error: GraphQLError, path: Path | undefined): void {
	const errorPositions = exeContext.errorPositions
	let current = path
	while (current !== undefined) {
		if (errorPositions.has(current)) {
			return
		}
		current = current.prev
	}
	if (errorPositions.has(undefined)) {
		return
	}
	errorPositions.add(path)
	exeContext.errors.push(error)
}

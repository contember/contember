/**
 * Value completion - processing resolver results
 */

import { GraphQLError } from 'graphql'
import type { FieldNode } from 'graphql'
import type { ExecutionContext } from '../types/execution.js'
import type { EnumType, InterfaceType, Type, TypeRef, UnionType } from '../types/schema.js'
import { EV, isAbstractType, isEnumType, isLeafType, isObjectType, isScalarType, T } from '../types/schema.js'
import type { ResolveInfo } from '../types/resolvers.js'
import type { Path } from '../utils/path.js'
import { addPath, pathToArray } from '../utils/path.js'
import { inspect, isIterableObject, isPromise } from '../utils/helpers.js'
import { getListItemType, isListType, isNonNullType, unwrapNonNull } from '../utils/typeRef.js'
import { collectSubfields, type GroupedFieldSet } from './collectFields.js'
import { executeFields, handleFieldError } from './fields.js'

// TypeKind name by its numeric value
const TYPE_KIND_NAMES = ['SCALAR', 'OBJECT', 'INTERFACE', 'UNION', 'ENUM', 'INPUT_OBJECT'] as const

/**
 * Memoized collectSubfields cache
 * Uses a composite key: exeContext + typeName + fieldNodes
 */
const subfieldCache = new WeakMap<
	ExecutionContext,
	Map<string, WeakMap<readonly FieldNode[], GroupedFieldSet>>
>()

function collectSubfieldsMemoized(
	exeContext: ExecutionContext,
	returnTypeName: string,
	fieldNodes: readonly FieldNode[],
): GroupedFieldSet {
	let typeCache = subfieldCache.get(exeContext)
	if (!typeCache) {
		typeCache = new Map()
		subfieldCache.set(exeContext, typeCache)
	}

	let nodeCache = typeCache.get(returnTypeName)
	if (!nodeCache) {
		nodeCache = new WeakMap()
		typeCache.set(returnTypeName, nodeCache)
	}

	let result = nodeCache.get(fieldNodes)
	if (!result) {
		result = collectSubfields(
			exeContext.schema,
			exeContext.fragments,
			exeContext.variableValues,
			returnTypeName,
			fieldNodes,
		)
		nodeCache.set(fieldNodes, result)
	}

	return result
}

/**
 * Complete a value based on its type
 */
export function completeValue(
	exeContext: ExecutionContext,
	returnTypeRef: TypeRef,
	fieldNodes: readonly FieldNode[],
	info: ResolveInfo,
	path: Path,
	result: unknown,
): unknown {
	const pattern = returnTypeRef[0]
	const typeName = returnTypeRef[1]

	// Handle promise
	if (isPromise(result)) {
		return result.then((resolved) => completeValue(exeContext, returnTypeRef, fieldNodes, info, path, resolved)).catch((rawError) => {
			const error = rawError instanceof Error ? rawError : new Error(String(rawError))
			return handleFieldError(error, returnTypeRef, fieldNodes, path, exeContext)
		})
	}

	// Handle errors thrown during resolution
	if (result instanceof Error) {
		return handleFieldError(result, returnTypeRef, fieldNodes, path, exeContext)
	}

	// Handle NonNull
	if (isNonNullType(pattern)) {
		const innerPattern = unwrapNonNull(pattern)
		const innerTypeRef: TypeRef = [innerPattern, typeName]

		const completed = completeValue(
			exeContext,
			innerTypeRef,
			fieldNodes,
			info,
			path,
			result,
		)

		if (completed === null) {
			throw new GraphQLError(
				`Cannot return null for non-nullable field ${info.parentType}.${info.fieldName}.`,
				{ nodes: fieldNodes, path: pathToArray(path) },
			)
		}

		if (isPromise(completed)) {
			return completed.then((resolved) => {
				if (resolved === null) {
					throw new GraphQLError(
						`Cannot return null for non-nullable field ${info.parentType}.${info.fieldName}.`,
						{ nodes: fieldNodes, path: pathToArray(path) },
					)
				}
				return resolved
			})
		}

		return completed
	}

	// Handle null result
	if (result === null || result === undefined) {
		return null
	}

	// Handle List (pattern >= 2 means list)
	if (isListType(pattern)) {
		return completeListValue(
			exeContext,
			returnTypeRef,
			fieldNodes,
			info,
			path,
			result,
		)
	}

	// Handle named type (pattern 0 = nullable named type)
	const type = exeContext.schema.t[typeName]

	if (!type) {
		throw new GraphQLError(`Unknown type "${typeName}".`)
	}

	// Handle leaf types (Scalar, Enum)
	if (isLeafType(type)) {
		return completeLeafValue(exeContext, typeName, type, result)
	}

	// Handle abstract types (Interface, Union)
	if (isAbstractType(type)) {
		return completeAbstractValue(
			exeContext,
			typeName,
			type,
			fieldNodes,
			info,
			path,
			result,
		)
	}

	// Handle Object type
	if (isObjectType(type)) {
		return completeObjectValue(
			exeContext,
			typeName,
			fieldNodes,
			info,
			path,
			result,
		)
	}

	throw new GraphQLError(`Cannot complete value of type "${TYPE_KIND_NAMES[type[0]] ?? 'unknown'}".`)
}

/**
 * Complete a list value
 */
function completeListValue(
	exeContext: ExecutionContext,
	returnTypeRef: TypeRef,
	fieldNodes: readonly FieldNode[],
	info: ResolveInfo,
	path: Path,
	result: unknown,
): unknown[] | Promise<unknown[]> {
	if (!isIterableObject(result)) {
		throw new GraphQLError(
			`Expected Iterable, but did not find one for field "${info.parentType}.${info.fieldName}".`,
			{ nodes: fieldNodes, path: pathToArray(path) },
		)
	}

	// Get inner type pattern
	const innerPattern = getListItemType(returnTypeRef[0])
	const innerTypeRef: TypeRef = [innerPattern, returnTypeRef[1]]

	const completedResults: unknown[] = []
	let containsPromise = false

	let index = 0
	for (const item of result) {
		const itemPath = addPath(path, index, undefined)
		try {
			const completed = completeValue(
				exeContext,
				innerTypeRef,
				fieldNodes,
				info,
				itemPath,
				item,
			)

			if (isPromise(completed)) {
				// Handle async completion with error catching
				const wrappedPromise = completed.then(undefined, (rawError) => {
					return handleListItemError(rawError, innerTypeRef, fieldNodes, itemPath, exeContext)
				})
				completedResults.push(wrappedPromise)
				containsPromise = true
			} else {
				completedResults.push(completed)
			}
		} catch (rawError) {
			const result = handleListItemError(rawError, innerTypeRef, fieldNodes, itemPath, exeContext)
			completedResults.push(result)
		}
		index++
	}

	if (containsPromise) {
		return Promise.all(completedResults)
	}

	return completedResults
}

/**
 * Handle error for a list item - throws for non-null items, returns null for nullable
 */
function handleListItemError(
	rawError: unknown,
	itemTypeRef: TypeRef,
	fieldNodes: readonly FieldNode[],
	itemPath: Path,
	exeContext: ExecutionContext,
): null {
	const error = rawError instanceof GraphQLError
		? rawError
		: new GraphQLError(
			rawError instanceof Error ? rawError.message : String(rawError),
			{ nodes: fieldNodes, path: pathToArray(itemPath), originalError: rawError instanceof Error ? rawError : undefined },
		)

	// If item type is non-null, error propagates up
	if (isNonNullType(itemTypeRef[0])) {
		throw error
	}

	// Otherwise, collect error and return null
	exeContext.errors.push(error)
	return null
}

/**
 * Complete a leaf value (Scalar or Enum)
 */
function completeLeafValue(
	exeContext: ExecutionContext,
	typeName: string,
	type: Type,
	result: unknown,
): unknown {
	if (isScalarType(type)) {
		const scalar = exeContext.scalars[typeName]
		if (scalar) {
			return scalar.serialize(result)
		}
		// No custom serializer - return as is
		return result
	}

	if (isEnumType(type)) {
		return serializeEnum(typeName, type, result)
	}

	throw new GraphQLError(`Cannot serialize value of type "${TYPE_KIND_NAMES[type[0]] ?? 'unknown'}".`)
}

/**
 * Serialize enum value
 */
function serializeEnum(typeName: string, type: EnumType, result: unknown): string {
	// EnumType: [kind, values, description?]
	const values = type[1]

	// If result is a string that matches an enum value name
	if (typeof result === 'string' && result in values) {
		return result
	}

	// Check if result matches any enum value's internal value
	for (const [name, enumValue] of Object.entries(values)) {
		// EnumValue: [value?, description?, deprecationReason?]
		const internalValue = EV.value(enumValue)
		if (internalValue === result || name === result) {
			return name
		}
	}

	throw new GraphQLError(
		`Enum "${typeName}" cannot represent value: ${inspect(result)}`,
	)
}

/**
 * Complete an abstract value (Interface or Union)
 */
function completeAbstractValue(
	exeContext: ExecutionContext,
	abstractTypeName: string,
	abstractType: Type,
	fieldNodes: readonly FieldNode[],
	info: ResolveInfo,
	path: Path,
	result: unknown,
): unknown {
	const resolveTypeFn = exeContext.typeResolvers[abstractTypeName]
	const abstractTypeInfo = { name: abstractTypeName, kind: abstractType[0] }

	let runtimeTypeName: string | null | undefined | Promise<string | null | undefined>

	try {
		if (resolveTypeFn) {
			runtimeTypeName = resolveTypeFn(result, exeContext.contextValue, info, abstractTypeInfo)
		} else {
			// Try __typename first
			runtimeTypeName = defaultTypeResolver(result, exeContext.contextValue, info, abstractTypeInfo)

			// If no __typename, try isTypeOf
			if (runtimeTypeName === null) {
				const possibleTypes = T.possibleTypes(abstractType as InterfaceType | UnionType)
				runtimeTypeName = resolveTypeWithIsTypeOf(exeContext, possibleTypes, result, info)
			}
		}
	} catch (error) {
		throw new GraphQLError(
			`Abstract type "${abstractTypeName}" resolver threw: ${error instanceof Error ? error.message : String(error)}`,
			{ nodes: fieldNodes, path: pathToArray(path), originalError: error instanceof Error ? error : undefined },
		)
	}

	if (isPromise(runtimeTypeName)) {
		return runtimeTypeName.then(
			(resolvedTypeName) =>
				ensureValidRuntimeType(
					exeContext,
					resolvedTypeName,
					abstractTypeName,
					fieldNodes,
					info,
					path,
					result,
				),
			(error) => {
				throw new GraphQLError(
					`Abstract type "${abstractTypeName}" resolver threw: ${error instanceof Error ? error.message : String(error)}`,
					{ nodes: fieldNodes, path: pathToArray(path), originalError: error instanceof Error ? error : undefined },
				)
			},
		)
	}

	return ensureValidRuntimeType(
		exeContext,
		runtimeTypeName,
		abstractTypeName,
		fieldNodes,
		info,
		path,
		result,
	)
}

/**
 * Resolve type using isTypeOf functions
 */
function resolveTypeWithIsTypeOf(
	exeContext: ExecutionContext,
	possibleTypes: string[],
	result: unknown,
	info: ResolveInfo,
): string | null | Promise<string | null> {
	const promiseResults: Array<{ typeName: string; isTypeOfResult: Promise<boolean> }> = []

	for (const typeName of possibleTypes) {
		const isTypeOfFn = exeContext.isTypeOfResolvers[typeName]
		if (isTypeOfFn) {
			const isTypeOfResult = isTypeOfFn(result, exeContext.contextValue, info)

			if (isPromise(isTypeOfResult)) {
				promiseResults.push({ typeName, isTypeOfResult })
			} else if (isTypeOfResult === true) {
				return typeName
			}
		}
	}

	// If we have any promises, wait for them
	if (promiseResults.length > 0) {
		return Promise.all(
			promiseResults.map(async ({ typeName, isTypeOfResult }) => {
				const result = await isTypeOfResult
				return result ? typeName : null
			}),
		).then((results) => {
			// Return the first type where isTypeOf returned true
			for (const typeName of results) {
				if (typeName !== null) {
					return typeName
				}
			}
			return null
		})
	}

	return null
}

/**
 * Validate and complete with the runtime type
 */
function ensureValidRuntimeType(
	exeContext: ExecutionContext,
	runtimeTypeName: string | null | undefined,
	abstractTypeName: string,
	fieldNodes: readonly FieldNode[],
	info: ResolveInfo,
	path: Path,
	result: unknown,
): Record<string, unknown> | Promise<Record<string, unknown>> {
	if (!runtimeTypeName) {
		throw new GraphQLError(
			`Abstract type "${abstractTypeName}" must resolve to an Object type at runtime for field "${info.parentType}.${info.fieldName}". `
				+ `Either the "${abstractTypeName}" type should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.`,
			{ nodes: fieldNodes, path: pathToArray(path) },
		)
	}

	// Validate that the runtime type exists and is an object type
	const runtimeType = exeContext.schema.t[runtimeTypeName]
	if (!runtimeType || !isObjectType(runtimeType)) {
		throw new GraphQLError(
			`Abstract type "${abstractTypeName}" was resolved to a non-object type "${runtimeTypeName}".`,
			{ nodes: fieldNodes, path: pathToArray(path) },
		)
	}

	// TODO: Validate that runtimeTypeName is a possible type of the abstract type
	// This would require checking if the type implements the interface or is part of the union

	return completeObjectValue(
		exeContext,
		runtimeTypeName,
		fieldNodes,
		info,
		path,
		result,
	)
}

/**
 * Default type resolver - uses __typename
 */
function defaultTypeResolver(
	value: unknown,
	_contextValue: unknown,
	_info: ResolveInfo,
	_abstractType: { name: string; kind: number },
): string | null {
	if (value && typeof value === 'object' && '__typename' in value) {
		return (value as { __typename: string }).__typename
	}
	return null
}

/**
 * Complete an object value
 */
function completeObjectValue(
	exeContext: ExecutionContext,
	typeName: string,
	fieldNodes: readonly FieldNode[],
	_info: ResolveInfo,
	path: Path,
	result: unknown,
): Record<string, unknown> | Promise<Record<string, unknown>> {
	// Collect subfields
	const subFieldNodes = collectSubfieldsMemoized(
		exeContext,
		typeName,
		fieldNodes,
	)

	// Execute subfields
	return executeFields(exeContext, typeName, result, path, subFieldNodes)
}

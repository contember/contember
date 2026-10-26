/**
 * Validation helper functions
 */
import type { InterfaceType, ObjectType, Schema, Type, TypeRef, UnionType } from '../types/schema.js'
import { TypeKind } from '../types/schema.js'
import { getListItemType, getTypeName, isListType, isNonNullType, unwrapNonNull } from '../utils/typeRef.js'

/**
 * Check if a type is an input type (can be used for arguments/variables)
 * Input types: Scalar, Enum, InputObject
 */
export function isInputType(type: Type): boolean {
	const kind = type[0]
	return kind === TypeKind.SCALAR || kind === TypeKind.ENUM || kind === TypeKind.INPUT_OBJECT
}

/**
 * Check if a type is an output type (can be used for field return types)
 * Output types: Scalar, Enum, Object, Interface, Union
 */
export function isOutputType(type: Type): boolean {
	const kind = type[0]
	return (
		kind === TypeKind.SCALAR
		|| kind === TypeKind.ENUM
		|| kind === TypeKind.OBJECT
		|| kind === TypeKind.INTERFACE
		|| kind === TypeKind.UNION
	)
}

/**
 * Get the named Type from a type reference
 */
export function getNamedTypeFromRef(
	schema: Schema,
	typeRef: TypeRef,
): Type | undefined {
	const typeName = getTypeName(typeRef)
	return schema.t[typeName]
}

/**
 * Check if maybeSubType is a subtype of superType
 * Used for variable type compatibility checking
 */
export function isTypeSubTypeOf(
	schema: Schema,
	maybeSubType: TypeRef,
	superType: TypeRef,
): boolean {
	const maybeSubPattern = maybeSubType[0]
	const maybeSubTypeName = maybeSubType[1]
	const superPattern = superType[0]
	const superTypeName = superType[1]

	// Equal types are subtypes
	if (areTypesEqual(maybeSubType, superType)) {
		return true
	}

	// If superType is non-null, maybeSubType must also be non-null
	if (isNonNullType(superPattern)) {
		if (isNonNullType(maybeSubPattern)) {
			const innerMaybeSub: TypeRef = [unwrapNonNull(maybeSubPattern), maybeSubTypeName]
			const innerSuper: TypeRef = [unwrapNonNull(superPattern), superTypeName]
			return isTypeSubTypeOf(schema, innerMaybeSub, innerSuper)
		}
		return false
	}

	// If maybeSubType is non-null but superType is nullable, unwrap and compare
	if (isNonNullType(maybeSubPattern)) {
		const innerMaybeSub: TypeRef = [unwrapNonNull(maybeSubPattern), maybeSubTypeName]
		return isTypeSubTypeOf(schema, innerMaybeSub, superType)
	}

	// If superType is a list, maybeSubType must also be a list
	if (isListType(superPattern)) {
		if (isListType(maybeSubPattern)) {
			const innerMaybeSub: TypeRef = [getListItemType(maybeSubPattern), maybeSubTypeName]
			const innerSuper: TypeRef = [getListItemType(superPattern), superTypeName]
			return isTypeSubTypeOf(schema, innerMaybeSub, innerSuper)
		}
		return false
	}

	// If maybeSubType is a list but superType is not, they're incompatible
	if (isListType(maybeSubPattern)) {
		return false
	}

	// Both are named types at this point (pattern = 0)
	// Same name = same type
	if (maybeSubTypeName === superTypeName) {
		return true
	}

	// Check if maybeSubType is an implementation of superType (interface/union)
	const superTypeObj = schema.t[superTypeName]
	const maybeSubTypeObj = schema.t[maybeSubTypeName]

	if (!superTypeObj || !maybeSubTypeObj) {
		return false
	}

	// If superType is an abstract type, check if maybeSubType is a possible type
	const superKind = superTypeObj[0]
	if (superKind === TypeKind.INTERFACE) {
		// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
		return (superTypeObj as InterfaceType)[3].includes(maybeSubTypeName)
	}
	if (superKind === TypeKind.UNION) {
		// UnionType: [kind, possibleTypes, description?]
		return (superTypeObj as UnionType)[1].includes(maybeSubTypeName)
	}

	// If maybeSubType is an object that implements superType interface
	if (maybeSubTypeObj[0] === TypeKind.OBJECT) {
		// ObjectType: [kind, fields, interfaces, description?]
		return (maybeSubTypeObj as ObjectType)[2].includes(superTypeName)
	}

	return false
}

/**
 * Check if two type references are structurally equal
 */
export function areTypesEqual(type1: TypeRef, type2: TypeRef): boolean {
	// Same pattern and same type name = equal
	return type1[0] === type2[0] && type1[1] === type2[1]
}

/**
 * Creates a suggestion list message for "Did you mean X?"
 * Simplified version - for full implementation, use suggestionList from graphql-js
 */
export function didYouMean(suggestions: readonly string[]): string {
	if (suggestions.length === 0) {
		return ''
	}

	if (suggestions.length === 1) {
		return ` Did you mean "${suggestions[0]}"?`
	}

	const quoted = suggestions.map((s) => `"${s}"`)
	const lastSuggestion = quoted.pop()
	return ` Did you mean ${quoted.join(', ')} or ${lastSuggestion}?`
}

/**
 * Simple Levenshtein distance for string similarity
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = []

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i]
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1]
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1, // deletion
				)
			}
		}
	}

	return matrix[b.length][a.length]
}

/**
 * Get suggestions for a string from a list of options
 * Returns options that are similar to input, sorted by similarity
 */
export function suggestionList(input: string, options: readonly string[]): string[] {
	const optionsByDistance: Map<string, number> = new Map()
	const threshold = Math.floor(input.length * 0.4) + 1

	for (const option of options) {
		const distance = levenshteinDistance(input, option)

		if (distance <= threshold || option.toLowerCase().includes(input.toLowerCase())) {
			optionsByDistance.set(option, distance)
		}
	}

	return [...optionsByDistance.entries()]
		.sort((a, b) => a[1] - b[1])
		.map(([option]) => option)
}

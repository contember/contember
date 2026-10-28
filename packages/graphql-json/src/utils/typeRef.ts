/**
 * TypeRef utilities for pattern-based type references
 *
 * Pattern encoding: [pattern, typeName]
 * Pattern IDs represent wrapper sequences from outside to inside.
 */

import { TypePattern, TypeRef } from '../types/schema.js'

// =============================================================================
// Pattern Constants
// =============================================================================

/**
 * Pattern metadata for each pattern ID
 * [isOuterNonNull, isOuterList, innerPattern or -1 if named]
 */
const PATTERN_META: readonly [boolean, boolean, number][] = [
	// 0: T (Named)
	[false, false, -1],
	// 1: T! (NonNull<Named>)
	[true, false, -1],
	// 2: [T] (List<Named>)
	[false, true, 0],
	// 3: [T!] (List<NonNull<Named>>)
	[false, true, 1],
	// 4: [T]! (NonNull<List<Named>>)
	[true, true, 0],
	// 5: [T!]! (NonNull<List<NonNull<Named>>>) - most common
	[true, true, 1],
	// 6: [[T]] (List<List<Named>>)
	[false, true, 2],
	// 7: [[T!]] (List<List<NonNull<Named>>>)
	[false, true, 3],
	// 8: [[T]!] (List<NonNull<List<Named>>>)
	[false, true, 4],
	// 9: [[T!]!] (List<NonNull<List<NonNull<Named>>>>)
	[false, true, 5],
	// 10: [[T]]! (NonNull<List<List<Named>>>)
	[true, true, 2],
	// 11: [[T]!]! (NonNull<List<NonNull<List<Named>>>>)
	[true, true, 4],
	// 12: [[T!]]! (NonNull<List<List<NonNull<Named>>>>)
	[true, true, 3],
	// 13: [[T!]!]! (NonNull<List<NonNull<List<NonNull<Named>>>>>)
	[true, true, 5],
	// 3-level nesting patterns
	// 14: [[[T]]] (List<List<List<Named>>>)
	[false, true, 6],
	// 15: [[[T!]]] (List<List<List<NonNull<Named>>>>)
	[false, true, 7],
	// 16: [[[T]!]] (List<List<NonNull<List<Named>>>>)
	[false, true, 8],
	// 17: [[[T!]!]] (List<List<NonNull<List<NonNull<Named>>>>>)
	[false, true, 9],
	// 18: [[[T]]!] (List<NonNull<List<List<Named>>>>)
	[false, true, 10],
	// 19: [[[T]]]! (NonNull<List<List<List<Named>>>>)
	[true, true, 6],
	// 20: [[[T]!]!] (List<NonNull<List<NonNull<List<Named>>>>>)
	[false, true, 11],
	// 21: [[[T]]!]! (NonNull<List<NonNull<List<List<Named>>>>>)
	[true, true, 10],
	// 22: [[[T]!]!]! (NonNull<List<NonNull<List<NonNull<List<Named>>>>>>)
	[true, true, 11],
	// 23: [[[T]!]]! (NonNull<List<List<NonNull<List<Named>>>>>)
	[true, true, 8],
	// 24: [[[T!]]]! (NonNull<List<List<List<NonNull<Named>>>>>)
	[true, true, 7],
	// 25: [[[T!]]!]! (NonNull<List<NonNull<List<List<NonNull<Named>>>>>>)
	[true, true, 12],
	// 26: [[[T!]!]!]! (NonNull<List<NonNull<List<NonNull<List<NonNull<Named>>>>>>>)
	[true, true, 13],
]

/**
 * String representation of each pattern (for formatting/debugging)
 */
const PATTERN_FORMAT: readonly string[] = [
	'%s', // 0: T
	'%s!', // 1: T!
	'[%s]', // 2: [T]
	'[%s!]', // 3: [T!]
	'[%s]!', // 4: [T]!
	'[%s!]!', // 5: [T!]!
	'[[%s]]', // 6: [[T]]
	'[[%s!]]', // 7: [[T!]]
	'[[%s]!]', // 8: [[T]!]
	'[[%s!]!]', // 9: [[T!]!]
	'[[%s]]!', // 10: [[T]]!
	'[[%s]!]!', // 11: [[T]!]!
	'[[%s!]]!', // 12: [[T!]]!
	'[[%s!]!]!', // 13: [[T!]!]!
	// 3-level nesting
	'[[[%s]]]', // 14: [[[T]]]
	'[[[%s!]]]', // 15: [[[T!]]]
	'[[[%s]!]]', // 16: [[[T]!]]
	'[[[%s!]!]]', // 17: [[[T!]!]]
	'[[[%s]]!]', // 18: [[[T]]!]
	'[[[%s]]]!', // 19: [[[T]]]!
	'[[[%s]!]!]', // 20: [[[T]!]!]
	'[[[%s]]!]!', // 21: [[[T]]!]!
	'[[[%s]!]!]!', // 22: [[[T]!]!]!
	'[[[%s]!]]!', // 23: [[[T]!]]!
	'[[[%s!]]]!', // 24: [[[T!]]]!
	'[[[%s!]]!]!', // 25: [[[T!]]!]!
	'[[[%s!]!]!]!', // 26: [[[T!]!]!]!
]

// =============================================================================
// TypeRef Accessors
// =============================================================================

/**
 * Get pattern ID from TypeRef
 */
export function getPattern(ref: TypeRef): number {
	return ref[0]
}

/**
 * Get type name from TypeRef
 */
export function getTypeName(ref: TypeRef): string {
	return ref[1]
}

/**
 * Alias for getTypeName - returns the named type
 */
export function getNamedType(ref: TypeRef): string {
	return ref[1]
}

// =============================================================================
// Pattern Checks
// =============================================================================

/**
 * Check if the outermost wrapper is NonNull
 */
export function isNonNullType(pattern: number): boolean {
	return PATTERN_META[pattern]?.[0] ?? false
}

/**
 * Check if the type is a list (possibly wrapped in NonNull)
 */
export function isListType(pattern: number): boolean {
	// Patterns 2+ involve lists
	return pattern >= 2
}

// =============================================================================
// Pattern Unwrapping
// =============================================================================

/**
 * Unwrap NonNull from pattern, returning the inner pattern
 * Returns same pattern if not NonNull
 */
export function unwrapNonNull(pattern: number): number {
	const meta = PATTERN_META[pattern]
	if (!meta || !meta[0]) return pattern // Not NonNull, return as-is

	// NonNull patterns and their unwrapped versions:
	switch (pattern) {
		case 1:
			return 0 // T! -> T
		case 4:
			return 2 // [T]! -> [T]
		case 5:
			return 3 // [T!]! -> [T!]
		case 10:
			return 6 // [[T]]! -> [[T]]
		case 11:
			return 8 // [[T]!]! -> [[T]!]
		case 12:
			return 7 // [[T!]]! -> [[T!]]
		case 13:
			return 9 // [[T!]!]! -> [[T!]!]
		default:
			return pattern
	}
}

/**
 * Get the list item pattern (unwrap both NonNull and List if present)
 */
export function getListItemType(pattern: number): number {
	// First unwrap NonNull if present
	let p = isNonNullType(pattern) ? unwrapNonNull(pattern) : pattern

	// Then get list inner pattern
	const meta = PATTERN_META[p]
	if (meta?.[1] && meta[2] >= 0) {
		return meta[2]
	}
	return p
}

// =============================================================================
// TypeRef Construction
// =============================================================================

/**
 * Create a TypeRef
 */
export function typeRef(pattern: number, typeName: string): TypeRef {
	return [pattern, typeName]
}

/**
 * Create TypeRef shortcuts
 */
export const ref = {
	named: (name: string): TypeRef => [TypePattern.T, name],
	nonNull: (name: string): TypeRef => [TypePattern.T_NN, name],
	list: (name: string): TypeRef => [TypePattern.L_T, name],
	listNonNull: (name: string): TypeRef => [TypePattern.L_T_NN, name],
	nonNullList: (name: string): TypeRef => [TypePattern.L_T_NN_NN, name],
	nonNullListNonNull: (name: string): TypeRef => [TypePattern.L_NN_T_NN, name],
} as const

// =============================================================================
// Formatting
// =============================================================================

/**
 * Format TypeRef as GraphQL type string (e.g., "[User!]!")
 */
export function formatTypeRef(ref: TypeRef): string {
	const format = PATTERN_FORMAT[ref[0]] ?? '%s'
	return format.replace('%s', ref[1])
}

// =============================================================================
// Pattern from AST TypeNode (for buildSchema from AST)
// =============================================================================

import type { TypeNode } from 'graphql'

/**
 * Convert GraphQL AST TypeNode to TypeRef
 */
export function typeRefFromAST(node: TypeNode): TypeRef {
	const { pattern, typeName } = analyzeTypeNode(node)
	return [pattern, typeName]
}

function analyzeTypeNode(node: TypeNode): { pattern: number; typeName: string } {
	// Collect wrapper sequence
	const wrappers: ('NonNull' | 'List')[] = []
	let current: TypeNode = node

	while (current.kind !== 'NamedType') {
		if (current.kind === 'NonNullType') {
			wrappers.push('NonNull')
			current = current.type
		} else if (current.kind === 'ListType') {
			wrappers.push('List')
			current = current.type
		}
	}

	const typeName = current.name.value
	const pattern = getPatternFromWrappers(wrappers)

	return { pattern, typeName }
}

function getPatternFromWrappers(wrappers: ('NonNull' | 'List')[]): number {
	// Convert wrapper sequence to pattern string for matching
	const seq = wrappers.join(',')

	// Map wrapper sequences to patterns
	const WRAPPER_TO_PATTERN: Record<string, number> = {
		'': TypePattern.T,
		'NonNull': TypePattern.T_NN,
		'List': TypePattern.L_T,
		'List,NonNull': TypePattern.L_T_NN,
		'NonNull,List': TypePattern.L_T_NN_NN,
		'NonNull,List,NonNull': TypePattern.L_NN_T_NN,
		'List,List': TypePattern.LL_T,
		'List,List,NonNull': TypePattern.LL_T_NN,
		'List,NonNull,List': TypePattern.LL_T_NN_NN,
		'List,NonNull,List,NonNull': TypePattern.LL_NN_T_NN,
		'NonNull,List,List': TypePattern.LL_T_NN_NN_NN,
		'NonNull,List,NonNull,List': TypePattern.LL_NN_T_NN_NN,
		'NonNull,List,List,NonNull': TypePattern.LL_T_NN_NN_NN_NN,
		'NonNull,List,NonNull,List,NonNull': TypePattern.LL_NN_T_NN_NN_NN,
		// 3-level nesting
		'List,List,List': TypePattern.LLL_T,
		'List,List,List,NonNull': TypePattern.LLL_T_NN,
		'List,List,NonNull,List': TypePattern.LLL_T_NN_NN,
		'List,List,NonNull,List,NonNull': TypePattern.LLL_NN_T_NN,
		'List,NonNull,List,List': TypePattern.LLL_T_NN_NN_NN,
		'NonNull,List,List,List': TypePattern.LLL_T_NN_NN_NN_NN,
		'List,NonNull,List,NonNull,List': TypePattern.LLL_NN_T_NN_NN,
		'NonNull,List,NonNull,List,List': TypePattern.LLL_NN_T_NN_NN_NN,
		'NonNull,List,NonNull,List,NonNull,List': TypePattern.LLL_NN_T_NN_NN_NN_NN,
		'NonNull,List,List,NonNull,List': TypePattern.LLL_T_NN_NN_NN_NN_NN,
		'NonNull,List,List,List,NonNull': TypePattern.LLL_T_NN_NN_NN_NN_NN_NN,
		'NonNull,List,NonNull,List,List,NonNull': TypePattern.LLL_NN_T_NN_NN_NN_NN_NN,
		'NonNull,List,NonNull,List,NonNull,List,NonNull': TypePattern.LLL_NN_NN_T_NN_NN_NN,
	}

	return WRAPPER_TO_PATTERN[seq] ?? TypePattern.T
}

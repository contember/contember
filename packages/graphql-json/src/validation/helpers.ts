/**
 * Validation helper functions
 */
import type { ASTNode } from 'graphql'
import type { Schema, Type, TypeRef } from '../types/schema.js'
import { TypeKind } from '../types/schema.js'
import { getListItemType, getTypeName, isListType, isNonNullType, unwrapNonNull } from '../utils/typeRef.js'
import { getOwn } from '../utils/helpers.js'

/**
 * Check if a visitor ancestor is a node rather than an array of nodes
 */
export function isASTNode(ancestor: ASTNode | readonly ASTNode[]): ancestor is ASTNode {
	return !Array.isArray(ancestor)
}

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
	return getOwn(schema.t, getTypeName(typeRef))
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
	const superTypeObj = getOwn(schema.t, superTypeName)
	const maybeSubTypeObj = getOwn(schema.t, maybeSubTypeName)

	if (!superTypeObj || !maybeSubTypeObj) {
		return false
	}

	// If superType is an abstract type, check if maybeSubType is a possible type
	if (superTypeObj[0] === TypeKind.INTERFACE) {
		// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
		return superTypeObj[3].includes(maybeSubTypeName)
	}
	if (superTypeObj[0] === TypeKind.UNION) {
		// UnionType: [kind, possibleTypes, description?]
		return superTypeObj[1].includes(maybeSubTypeName)
	}

	// If maybeSubType is an object that implements superType interface
	if (maybeSubTypeObj[0] === TypeKind.OBJECT) {
		// ObjectType: [kind, fields, interfaces, description?]
		return maybeSubTypeObj[2].includes(superTypeName)
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

const MAX_SUGGESTIONS = 5

/**
 * Given [ A, B, C ] return ' Did you mean A, B, or C?', as graphql-js `didYouMean` does
 */
export function didYouMean(suggestions: readonly string[]): string
export function didYouMean(subMessage: string, suggestions: readonly string[]): string
export function didYouMean(firstArg: string | readonly string[], secondArg?: readonly string[]): string {
	const subMessage = typeof firstArg === 'string' ? firstArg : undefined
	const suggestionsArg = typeof firstArg === 'string' ? secondArg ?? [] : firstArg

	let message = ' Did you mean '
	if (subMessage) {
		message += subMessage + ' '
	}

	const suggestions = suggestionsArg.map(x => `"${x}"`)
	switch (suggestions.length) {
		case 0:
			return ''
		case 1:
			return message + suggestions[0] + '?'
		case 2:
			return message + suggestions[0] + ' or ' + suggestions[1] + '?'
	}

	const selected = suggestions.slice(0, MAX_SUGGESTIONS)
	const lastItem = selected.pop()
	return message + selected.join(', ') + ', or ' + lastItem + '?'
}

/**
 * Given an invalid input string and a list of valid options, returns a filtered list of valid options sorted based on
 * their similarity with the input, as graphql-js `suggestionList` does
 */
export function suggestionList(input: string, options: readonly string[]): string[] {
	const optionsByDistance = new Map<string, number>()
	const lexicalDistance = new LexicalDistance(input)
	const threshold = Math.floor(input.length * 0.4) + 1

	for (const option of options) {
		const distance = lexicalDistance.measure(option, threshold)
		if (distance !== undefined) {
			optionsByDistance.set(option, distance)
		}
	}

	return [...optionsByDistance.keys()].sort((a, b) => {
		const distanceDiff = (optionsByDistance.get(a) ?? 0) - (optionsByDistance.get(b) ?? 0)
		return distanceDiff !== 0 ? distanceDiff : naturalCompare(a, b)
	})
}

/**
 * Damerau-Levenshtein distance that counts a case change as a single edit (graphql-js `LexicalDistance`)
 */
class LexicalDistance {
	private readonly inputLowerCase: string
	private readonly inputArray: number[]
	private readonly rows: [number[], number[], number[]]

	constructor(private readonly input: string) {
		this.inputLowerCase = input.toLowerCase()
		this.inputArray = stringToArray(this.inputLowerCase)
		this.rows = [new Array(input.length + 1).fill(0), new Array(input.length + 1).fill(0), new Array(input.length + 1).fill(0)]
	}

	measure(option: string, threshold: number): number | undefined {
		if (this.input === option) {
			return 0
		}

		const optionLowerCase = option.toLowerCase()

		// Any case change counts as a single edit
		if (this.inputLowerCase === optionLowerCase) {
			return 1
		}

		let a = stringToArray(optionLowerCase)
		let b = this.inputArray

		if (a.length < b.length) {
			const tmp = a
			a = b
			b = tmp
		}
		const aLength = a.length
		const bLength = b.length

		if (aLength - bLength > threshold) {
			return undefined
		}

		const rows = this.rows
		for (let j = 0; j <= bLength; j++) {
			rows[0][j] = j
		}

		for (let i = 1; i <= aLength; i++) {
			const upRow = rows[(i - 1) % 3]
			const currentRow = rows[i % 3]

			let smallestCell = (currentRow[0] = i)
			for (let j = 1; j <= bLength; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1

				let currentCell = Math.min(
					upRow[j] + 1, // delete
					currentRow[j - 1] + 1, // insert
					upRow[j - 1] + cost, // substitute
				)

				if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
					// transposition
					const doubleDiagonalCell = rows[(i - 2) % 3][j - 2]
					currentCell = Math.min(currentCell, doubleDiagonalCell + 1)
				}

				if (currentCell < smallestCell) {
					smallestCell = currentCell
				}

				currentRow[j] = currentCell
			}

			// Early exit, since distance can't go smaller than smallest element of the previous row.
			if (smallestCell > threshold) {
				return undefined
			}
		}

		const distance = rows[aLength % 3][bLength]
		return distance <= threshold ? distance : undefined
	}
}

function stringToArray(str: string): number[] {
	const strLength = str.length
	const array = new Array<number>(strLength)
	for (let i = 0; i < strLength; ++i) {
		array[i] = str.charCodeAt(i)
	}
	return array
}

const DIGIT_0 = 48
const DIGIT_9 = 57

function isDigit(code: number): boolean {
	return !Number.isNaN(code) && DIGIT_0 <= code && code <= DIGIT_9
}

/**
 * Compares strings with embedded numbers by their numeric value, as graphql-js `naturalCompare` does
 */
export function naturalCompare(aStr: string, bStr: string): number {
	let aIndex = 0
	let bIndex = 0

	while (aIndex < aStr.length && bIndex < bStr.length) {
		let aChar = aStr.charCodeAt(aIndex)
		let bChar = bStr.charCodeAt(bIndex)

		if (isDigit(aChar) && isDigit(bChar)) {
			let aNum = 0
			do {
				++aIndex
				aNum = aNum * 10 + aChar - DIGIT_0
				aChar = aStr.charCodeAt(aIndex)
			} while (isDigit(aChar) && aNum > 0)

			let bNum = 0
			do {
				++bIndex
				bNum = bNum * 10 + bChar - DIGIT_0
				bChar = bStr.charCodeAt(bIndex)
			} while (isDigit(bChar) && bNum > 0)

			if (aNum < bNum) {
				return -1
			}

			if (aNum > bNum) {
				return 1
			}
		} else {
			if (aChar < bChar) {
				return -1
			}
			if (aChar > bChar) {
				return 1
			}
			++aIndex
			++bIndex
		}
	}

	return aStr.length - bStr.length
}

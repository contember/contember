/**
 * Port of graphql-js `sortValueNode` (internal there): a copy of the value with object fields in natural name order.
 */
import type { ObjectFieldNode, ValueNode } from 'graphql'
import { Kind } from 'graphql'

export function sortValueNode(valueNode: ValueNode): ValueNode {
	switch (valueNode.kind) {
		case Kind.OBJECT:
			return { ...valueNode, fields: sortFields(valueNode.fields) }
		case Kind.LIST:
			return { ...valueNode, values: valueNode.values.map(sortValueNode) }
		case Kind.INT:
		case Kind.FLOAT:
		case Kind.STRING:
		case Kind.BOOLEAN:
		case Kind.NULL:
		case Kind.ENUM:
		case Kind.VARIABLE:
			return valueNode
	}
}

function sortFields(fields: ReadonlyArray<ObjectFieldNode>): ObjectFieldNode[] {
	return fields
		.map((fieldNode) => ({
			...fieldNode,
			value: sortValueNode(fieldNode.value),
		}))
		.sort((fieldA, fieldB) => naturalCompare(fieldA.name.value, fieldB.name.value))
}

const DIGIT_0 = 48
const DIGIT_9 = 57

/**
 * Port of graphql-js `naturalCompare`: digit runs compare by numeric value.
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

function isDigit(code: number): boolean {
	return !isNaN(code) && DIGIT_0 <= code && code <= DIGIT_9
}

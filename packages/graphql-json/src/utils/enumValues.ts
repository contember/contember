/**
 * Enum input coercion, ported from graphql-js `GraphQLEnumType.parseValue` and `parseLiteral`
 */

import { GraphQLError, Kind, print } from 'graphql'
import type { ValueNode } from 'graphql'
import type { EnumType, EnumValue } from '../types/schema.js'
import { didYouMean, suggestionList } from '../validation/helpers.js'
import { inspect } from './helpers.js'

function getEnumValue(type: EnumType, name: string): EnumValue | undefined {
	return Object.prototype.hasOwnProperty.call(type[1], name) ? type[1][name] : undefined
}

/** The internal value of an enum value; an enum value without one stands for its name */
function internalValue(enumValue: EnumValue, name: string): unknown {
	return enumValue[0] !== undefined ? enumValue[0] : name
}

function didYouMeanEnumValue(type: EnumType, unknownValueStr: string): string {
	return didYouMean('the enum value', suggestionList(unknownValueStr, Object.keys(type[1])))
}

/**
 * Coerce a runtime (variable) value to the internal value of an enum, throwing the graphql-js error
 */
export function parseEnumValue(typeName: string, type: EnumType, inputValue: unknown): unknown {
	if (typeof inputValue !== 'string') {
		const valueStr = inspect(inputValue)
		throw new GraphQLError(`Enum "${typeName}" cannot represent non-string value: ${valueStr}.` + didYouMeanEnumValue(type, valueStr))
	}
	const enumValue = getEnumValue(type, inputValue)
	if (enumValue === undefined) {
		throw new GraphQLError(`Value "${inputValue}" does not exist in "${typeName}" enum.` + didYouMeanEnumValue(type, inputValue))
	}
	return internalValue(enumValue, inputValue)
}

/**
 * Coerce a literal to the internal value of an enum, throwing the graphql-js error
 */
export function parseEnumLiteral(typeName: string, type: EnumType, valueNode: ValueNode): unknown {
	if (valueNode.kind !== Kind.ENUM) {
		const valueStr = print(valueNode)
		throw new GraphQLError(`Enum "${typeName}" cannot represent non-enum value: ${valueStr}.` + didYouMeanEnumValue(type, valueStr), {
			nodes: valueNode,
		})
	}
	const enumValue = getEnumValue(type, valueNode.value)
	if (enumValue === undefined) {
		const valueStr = print(valueNode)
		throw new GraphQLError(`Value "${valueStr}" does not exist in "${typeName}" enum.` + didYouMeanEnumValue(type, valueStr), {
			nodes: valueNode,
		})
	}
	return internalValue(enumValue, valueNode.value)
}

/**
 * The internal value of an enum literal, or undefined when the literal is not a value of the enum
 */
export function enumLiteralValue(type: EnumType, valueNode: ValueNode): unknown {
	if (valueNode.kind !== Kind.ENUM) {
		return undefined
	}
	const enumValue = getEnumValue(type, valueNode.value)
	return enumValue === undefined ? undefined : internalValue(enumValue, valueNode.value)
}

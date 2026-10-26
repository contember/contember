/**
 * Built-in scalar implementations
 */

import { Kind } from 'graphql'
import type { ValueNode } from 'graphql'
import type { ScalarImplementation, ScalarMap } from '../types/resolvers.js'
import { inspect } from '../utils/helpers.js'

// GraphQL Int limits (32-bit signed integer)
const GRAPHQL_MAX_INT = 2147483647
const GRAPHQL_MIN_INT = -2147483648

/**
 * Serialize object value (handles valueOf)
 */
function serializeObject(outputValue: unknown): unknown {
	if (typeof outputValue === 'object' && outputValue !== null) {
		if (typeof (outputValue as { valueOf: () => unknown }).valueOf === 'function') {
			const valueOfResult = (outputValue as { valueOf: () => unknown }).valueOf()
			if (typeof valueOfResult !== 'object') {
				return valueOfResult
			}
		}
		if (typeof (outputValue as { toJSON: () => unknown }).toJSON === 'function') {
			return (outputValue as { toJSON: () => unknown }).toJSON()
		}
	}
	return outputValue
}

/**
 * Int scalar
 */
export const GraphQLIntScalar: ScalarImplementation = {
	serialize(outputValue: unknown): number {
		const coercedValue = serializeObject(outputValue)

		if (typeof coercedValue === 'boolean') {
			return coercedValue ? 1 : 0
		}

		let num = coercedValue
		if (typeof coercedValue === 'string' && coercedValue !== '') {
			num = Number(coercedValue)
		}

		if (typeof num !== 'number' || !Number.isInteger(num)) {
			throw new Error(
				`Int cannot represent non-integer value: ${inspect(coercedValue)}`,
			)
		}
		if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
			throw new Error(
				`Int cannot represent non 32-bit signed integer value: ${inspect(coercedValue)}`,
			)
		}
		return num
	},

	parseValue(inputValue: unknown): number {
		if (typeof inputValue !== 'number' || !Number.isInteger(inputValue)) {
			throw new Error(
				`Int cannot represent non-integer value: ${inspect(inputValue)}`,
			)
		}
		if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
			throw new Error(
				`Int cannot represent non 32-bit signed integer value: ${inputValue}`,
			)
		}
		return inputValue
	},

	parseLiteral(ast: unknown): number {
		const valueNode = ast as ValueNode
		if (valueNode.kind !== Kind.INT) {
			throw new Error(
				`Int cannot represent non-integer value: ${(valueNode as { value?: string }).value ?? valueNode.kind}`,
			)
		}
		const num = parseInt(valueNode.value, 10)
		if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
			throw new Error(
				`Int cannot represent non 32-bit signed integer value: ${valueNode.value}`,
			)
		}
		return num
	},
}

/**
 * Float scalar
 */
export const GraphQLFloatScalar: ScalarImplementation = {
	serialize(outputValue: unknown): number {
		const coercedValue = serializeObject(outputValue)

		if (typeof coercedValue === 'boolean') {
			return coercedValue ? 1 : 0
		}

		let num = coercedValue
		if (typeof coercedValue === 'string' && coercedValue !== '') {
			num = Number(coercedValue)
		}

		if (typeof num !== 'number' || !Number.isFinite(num)) {
			throw new Error(
				`Float cannot represent non numeric value: ${inspect(coercedValue)}`,
			)
		}
		return num
	},

	parseValue(inputValue: unknown): number {
		if (typeof inputValue !== 'number' || !Number.isFinite(inputValue)) {
			throw new Error(
				`Float cannot represent non numeric value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(ast: unknown): number {
		const valueNode = ast as ValueNode
		if (valueNode.kind !== Kind.FLOAT && valueNode.kind !== Kind.INT) {
			throw new Error(
				`Float cannot represent non numeric value: ${(valueNode as { value?: string }).value ?? valueNode.kind}`,
			)
		}
		return parseFloat((valueNode as { value: string }).value)
	},
}

/**
 * String scalar
 */
export const GraphQLStringScalar: ScalarImplementation = {
	serialize(outputValue: unknown): string {
		const coercedValue = serializeObject(outputValue)

		if (typeof coercedValue === 'string') {
			return coercedValue
		}
		if (typeof coercedValue === 'boolean') {
			return coercedValue ? 'true' : 'false'
		}
		if (typeof coercedValue === 'number' && Number.isFinite(coercedValue)) {
			return String(coercedValue)
		}
		throw new Error(
			`String cannot represent value: ${inspect(coercedValue)}`,
		)
	},

	parseValue(inputValue: unknown): string {
		if (typeof inputValue !== 'string') {
			throw new Error(
				`String cannot represent a non string value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(ast: unknown): string {
		const valueNode = ast as ValueNode
		if (valueNode.kind !== Kind.STRING) {
			throw new Error(
				`String cannot represent a non string value: ${(valueNode as { value?: string }).value ?? valueNode.kind}`,
			)
		}
		return valueNode.value
	},
}

/**
 * Boolean scalar
 */
export const GraphQLBooleanScalar: ScalarImplementation = {
	serialize(outputValue: unknown): boolean {
		const coercedValue = serializeObject(outputValue)

		if (typeof coercedValue === 'boolean') {
			return coercedValue
		}
		if (typeof coercedValue === 'number' && Number.isFinite(coercedValue)) {
			return coercedValue !== 0
		}
		throw new Error(
			`Boolean cannot represent a non boolean value: ${inspect(coercedValue)}`,
		)
	},

	parseValue(inputValue: unknown): boolean {
		if (typeof inputValue !== 'boolean') {
			throw new Error(
				`Boolean cannot represent a non boolean value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(ast: unknown): boolean {
		const valueNode = ast as ValueNode
		if (valueNode.kind !== Kind.BOOLEAN) {
			throw new Error(
				`Boolean cannot represent a non boolean value: ${(valueNode as { value?: string }).value ?? valueNode.kind}`,
			)
		}
		return valueNode.value
	},
}

/**
 * ID scalar
 */
export const GraphQLIDScalar: ScalarImplementation = {
	serialize(outputValue: unknown): string {
		const coercedValue = serializeObject(outputValue)

		if (typeof coercedValue === 'string') {
			return coercedValue
		}
		if (typeof coercedValue === 'number' && Number.isInteger(coercedValue)) {
			return String(coercedValue)
		}
		throw new Error(
			`ID cannot represent value: ${inspect(coercedValue)}`,
		)
	},

	parseValue(inputValue: unknown): string {
		if (typeof inputValue === 'string') {
			return inputValue
		}
		if (typeof inputValue === 'number' && Number.isInteger(inputValue)) {
			return String(inputValue)
		}
		throw new Error(
			`ID cannot represent value: ${inspect(inputValue)}`,
		)
	},

	parseLiteral(ast: unknown): string {
		const valueNode = ast as ValueNode
		if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.INT) {
			throw new Error(
				`ID cannot represent a non-string and non-integer value: ${valueNode.kind}`,
			)
		}
		return (valueNode as { value: string }).value
	},
}

/**
 * Built-in scalar map
 */
export const builtInScalars: ScalarMap = {
	Int: GraphQLIntScalar,
	Float: GraphQLFloatScalar,
	String: GraphQLStringScalar,
	Boolean: GraphQLBooleanScalar,
	ID: GraphQLIDScalar,
}

const scalarsWithBuiltInsCache = new WeakMap<ScalarMap, ScalarMap>()

/**
 * Built-in scalars overridden by the given custom scalars, memoized per `scalars` object.
 */
export function withBuiltInScalars(scalars?: ScalarMap): ScalarMap {
	if (!scalars) {
		return builtInScalars
	}
	let merged = scalarsWithBuiltInsCache.get(scalars)
	if (!merged) {
		merged = { ...builtInScalars, ...scalars }
		scalarsWithBuiltInsCache.set(scalars, merged)
	}
	return merged
}

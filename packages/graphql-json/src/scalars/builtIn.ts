/**
 * Built-in scalar implementations
 */

import { GraphQLError, Kind, print } from 'graphql'
import type { ValueNode } from 'graphql'
import type { ScalarImplementation, ScalarMap } from '../types/resolvers.js'
import { inspect, isObjectLike } from '../utils/helpers.js'

// GraphQL Int limits (32-bit signed integer)
const GRAPHQL_MAX_INT = 2147483647
const GRAPHQL_MIN_INT = -2147483648

/**
 * Serialize object value (handles valueOf)
 */
function serializeObject(outputValue: unknown): unknown {
	if (isObjectLike(outputValue)) {
		const valueOf = outputValue.valueOf
		if (typeof valueOf === 'function') {
			const valueOfResult: unknown = valueOf.call(outputValue)
			if (!isObjectLike(valueOfResult)) {
				return valueOfResult
			}
		}
		const toJSON = outputValue.toJSON
		if (typeof toJSON === 'function') {
			return toJSON.call(outputValue)
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
			throw new GraphQLError(
				`Int cannot represent non-integer value: ${inspect(coercedValue)}`,
			)
		}
		if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
			throw new GraphQLError(
				'Int cannot represent non 32-bit signed integer value: ' + inspect(coercedValue),
			)
		}
		return num
	},

	parseValue(inputValue: unknown): number {
		if (typeof inputValue !== 'number' || !Number.isInteger(inputValue)) {
			throw new GraphQLError(
				`Int cannot represent non-integer value: ${inspect(inputValue)}`,
			)
		}
		if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
			throw new GraphQLError(
				`Int cannot represent non 32-bit signed integer value: ${inputValue}`,
			)
		}
		return inputValue
	},

	parseLiteral(valueNode: ValueNode): number {
		if (valueNode.kind !== Kind.INT) {
			throw new GraphQLError(
				`Int cannot represent non-integer value: ${print(valueNode)}`,
				{ nodes: valueNode },
			)
		}
		const num = parseInt(valueNode.value, 10)
		if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
			throw new GraphQLError(
				`Int cannot represent non 32-bit signed integer value: ${valueNode.value}`,
				{ nodes: valueNode },
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
			throw new GraphQLError(
				`Float cannot represent non numeric value: ${inspect(coercedValue)}`,
			)
		}
		return num
	},

	parseValue(inputValue: unknown): number {
		if (typeof inputValue !== 'number' || !Number.isFinite(inputValue)) {
			throw new GraphQLError(
				`Float cannot represent non numeric value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(valueNode: ValueNode): number {
		if (valueNode.kind !== Kind.FLOAT && valueNode.kind !== Kind.INT) {
			throw new GraphQLError(
				`Float cannot represent non numeric value: ${print(valueNode)}`,
				{ nodes: valueNode },
			)
		}
		return parseFloat(valueNode.value)
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
		throw new GraphQLError(
			`String cannot represent value: ${inspect(outputValue)}`,
		)
	},

	parseValue(inputValue: unknown): string {
		if (typeof inputValue !== 'string') {
			throw new GraphQLError(
				`String cannot represent a non string value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(valueNode: ValueNode): string {
		if (valueNode.kind !== Kind.STRING) {
			throw new GraphQLError(
				`String cannot represent a non string value: ${print(valueNode)}`,
				{ nodes: valueNode },
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
		throw new GraphQLError(
			`Boolean cannot represent a non boolean value: ${inspect(coercedValue)}`,
		)
	},

	parseValue(inputValue: unknown): boolean {
		if (typeof inputValue !== 'boolean') {
			throw new GraphQLError(
				`Boolean cannot represent a non boolean value: ${inspect(inputValue)}`,
			)
		}
		return inputValue
	},

	parseLiteral(valueNode: ValueNode): boolean {
		if (valueNode.kind !== Kind.BOOLEAN) {
			throw new GraphQLError(
				`Boolean cannot represent a non boolean value: ${print(valueNode)}`,
				{ nodes: valueNode },
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
		throw new GraphQLError(
			`ID cannot represent value: ${inspect(outputValue)}`,
		)
	},

	parseValue(inputValue: unknown): string {
		if (typeof inputValue === 'string') {
			return inputValue
		}
		if (typeof inputValue === 'number' && Number.isInteger(inputValue)) {
			return String(inputValue)
		}
		throw new GraphQLError(
			`ID cannot represent value: ${inspect(inputValue)}`,
		)
	},

	parseLiteral(valueNode: ValueNode): string {
		if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.INT) {
			throw new GraphQLError(
				`ID cannot represent a non-string and non-integer value: ${print(valueNode)}`,
				{ nodes: valueNode },
			)
		}
		return valueNode.value
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

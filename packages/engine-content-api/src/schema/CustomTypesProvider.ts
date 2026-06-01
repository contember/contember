import { GraphQLScalarType, Kind } from 'graphql'
import { JSONType, UuidType } from '@contember/graphql-utils'

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?$/

const DECIMAL_REGEX = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/

function validateDecimal(value: unknown): string {
	// Numeric values are transported as strings to avoid JS float precision loss.
	// Plain numbers are accepted for convenience but normalized to a string.
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			throw new TypeError(`Decimal value must be a finite number, got: ${value}`)
		}
		return String(value)
	}
	if (typeof value !== 'string') {
		throw new TypeError(`Decimal value must be a string, got: ${typeof value}`)
	}
	if (!DECIMAL_REGEX.test(value.trim())) {
		throw new TypeError(`Value is not a valid decimal: ${value}`)
	}
	return value.trim()
}

function validateTime(value: unknown): string {
	if (typeof value !== 'string') {
		throw new TypeError(`Time value must be a string, got: ${typeof value}`)
	}
	const match = TIME_REGEX.exec(value)
	if (!match) {
		throw new TypeError(`Value is not a valid time: ${value}`)
	}

	const hours = match[1]
	const minutes = match[2]
	const seconds = match[3] || '00'
	const fraction = match[4] ? `.${match[4]}` : ''

	return `${hours}:${minutes}:${seconds}${fraction}`
}

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType = UuidType

	// todo: implement serialize, parseValue and parseLiteral properly

	public readonly dateType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Date',
		serialize: str => String(str),
		parseValue: str => String(str),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? ast.value : undefined
		},
	})

	public readonly timeType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Time',
		serialize(value) {
			return validateTime(value)
		},
		parseValue(value) {
			return validateTime(value)
		},
		parseLiteral(ast) {
			if (ast.kind !== Kind.STRING) {
				throw new TypeError(`Time scalar can only parse string values, got: ${ast.kind}`)
			}
			return validateTime(ast.value)
		},
	})

	public readonly dateTimeType: GraphQLScalarType = new GraphQLScalarType({
		name: 'DateTime',
		serialize: str => String(str),
		parseValue: str => String(str),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? ast.value : undefined
		},
	})
	public readonly jsonType: GraphQLScalarType = JSONType

	public readonly decimalType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Decimal',
		description: 'Arbitrary precision decimal number, transported as a string to avoid floating-point precision loss.',
		serialize(value) {
			return validateDecimal(value)
		},
		parseValue(value) {
			return validateDecimal(value)
		},
		parseLiteral(ast) {
			if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
				return validateDecimal(ast.value)
			}
			throw new TypeError(`Decimal scalar can only parse string or numeric values, got: ${ast.kind}`)
		},
	})
}

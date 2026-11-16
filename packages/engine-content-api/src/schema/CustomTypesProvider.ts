import { GraphQLError, GraphQLScalarType, Kind, ValueNode } from 'graphql'
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

const ISO_DATE_PREFIX_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/

// Over-matching only defers a value to PostgreSQL; `2025-02-29BC` has no word boundary before BC.
const BC_ERA_REGEX = /BC/i

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const daysInMonth = (year: number, month: number): number => {
	const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
	return month === 2 && isLeapYear ? 29 : DAYS_IN_MONTH[month - 1]
}

// Rejects an ISO-shaped calendar date that does not exist (e.g. 2026-02-30, year 0000), which PostgreSQL would refuse.
// Other input formats PostgreSQL accepts, and BC dates, are passed through unchanged.
function validateCalendarDate(value: string): string {
	const match = ISO_DATE_PREFIX_REGEX.exec(value)
	if (!match || BC_ERA_REGEX.test(value)) {
		return value
	}
	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
		throw new TypeError(`Value is not a valid date: ${value}`)
	}
	return value
}

// graphql-js passes a GraphQLError thrown while parsing input through as is, and engine-http reports it as a client error.
// Any other error becomes the originalError of a wrapping GraphQLError, which engine-http unwraps and reports as internal.
function parseInput<T>(parse: () => T, node?: ValueNode): T {
	try {
		return parse()
	} catch (error) {
		if (error instanceof TypeError) {
			throw new GraphQLError(error.message, { nodes: node })
		}
		throw error
	}
}

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType = UuidType

	// todo: implement serialize, parseValue and parseLiteral properly

	public readonly dateType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Date',
		serialize: str => String(str),
		parseValue: str => parseInput(() => validateCalendarDate(String(str))),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? parseInput(() => validateCalendarDate(ast.value), ast) : undefined
		},
	})

	public readonly timeType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Time',
		serialize(value) {
			return validateTime(value)
		},
		parseValue(value) {
			return parseInput(() => validateTime(value))
		},
		parseLiteral(ast) {
			return parseInput(() => {
				if (ast.kind !== Kind.STRING) {
					throw new TypeError(`Time scalar can only parse string values, got: ${ast.kind}`)
				}
				return validateTime(ast.value)
			}, ast)
		},
	})

	public readonly dateTimeType: GraphQLScalarType = new GraphQLScalarType({
		name: 'DateTime',
		serialize: str => String(str),
		parseValue: str => parseInput(() => validateCalendarDate(String(str))),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? parseInput(() => validateCalendarDate(ast.value), ast) : undefined
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
			return parseInput(() => validateDecimal(value))
		},
		parseLiteral(ast) {
			return parseInput(() => {
				if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
					return validateDecimal(ast.value)
				}
				throw new TypeError(`Decimal scalar can only parse string or numeric values, got: ${ast.kind}`)
			}, ast)
		},
	})
}

import { describe, expect, it } from 'bun:test'
import { GraphQLError, GraphQLScalarType, Kind, StringValueNode } from 'graphql'
import { CustomTypesProvider } from '../../../src/index.js'

const stringLiteral = (value: string): StringValueNode => ({ kind: Kind.STRING, value })

const provider = new CustomTypesProvider()

const cases: [name: string, type: GraphQLScalarType, valid: string[], impossible: string[]][] = [
	[
		'Date',
		provider.dateType,
		['2026-02-28', '2024-02-29', '2000-02-29', '0001-01-01', '2026-1-5', '2026-12-31'],
		['2026-02-30', '0000-02-02', '2026-02-29', '1900-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '2026-01-00', '2026-01-32'],
	],
	[
		'DateTime',
		provider.dateTimeType,
		['2026-02-28T10:00:00Z', '2024-02-29 23:59:59.999+02:00', '2026-12-31T23:59:59.999999Z'],
		['2026-02-30T10:00:00Z', '0000-02-02T00:00:00+00:00', '2026-13-01 20:00'],
	],
]

describe.each(cases)('%s graphql type', (_, type, valid, impossible) => {
	it('accepts an existing calendar date', () => {
		for (const value of valid) {
			expect(type.parseValue(value)).toEqual(value)
			expect(type.parseLiteral(stringLiteral(value), undefined)).toEqual(value)
		}
	})

	it('rejects an impossible calendar date', () => {
		for (const value of impossible) {
			expect(() => type.parseValue(value)).toThrow(`Value is not a valid date: ${value}`)
			expect(() => type.parseLiteral(stringLiteral(value), undefined)).toThrow(`Value is not a valid date: ${value}`)
			// engine-http reports only a GraphQLError without an underlying cause as a client error
			expect(() => type.parseValue(value)).toThrow(GraphQLError)
		}
	})

	it('leaves other formats to the database', () => {
		for (const value of ['now', 'infinity', 'Feb 30 2026', '0001-02-29 BC', '2025-02-29BC', '10000-01-01']) {
			expect(type.parseValue(value)).toEqual(value)
		}
	})
})

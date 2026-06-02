import { describe, expect, it } from 'bun:test'
import { Kind } from 'graphql'
import { CustomTypesProvider } from '../../../src'

describe('decimal graphql type', () => {
	const decimalType = new CustomTypesProvider().decimalType

	it('accepts a plain decimal string and trims it', () => {
		expect(decimalType.parseValue('123.45')).toEqual('123.45')
		expect(decimalType.parseValue('  -0.001  ')).toEqual('-0.001')
		expect(decimalType.parseValue('+42')).toEqual('+42')
		expect(decimalType.parseValue('.5')).toEqual('.5')
		expect(decimalType.parseValue('5.')).toEqual('5.')
	})

	it('accepts scientific notation', () => {
		expect(decimalType.parseValue('1.5e10')).toEqual('1.5e10')
		expect(decimalType.parseValue('1.5E-10')).toEqual('1.5E-10')
		expect(decimalType.parseValue('-2e+3')).toEqual('-2e+3')
	})

	it('normalizes a JSON number input to a string', () => {
		expect(decimalType.parseValue(123.45)).toEqual('123.45')
		expect(decimalType.parseValue(0)).toEqual('0')
		expect(decimalType.parseValue(-7)).toEqual('-7')
	})

	it('rejects an invalid decimal string', () => {
		expect(() => decimalType.parseValue('abc')).toThrow()
		expect(() => decimalType.parseValue('1.2.3')).toThrow()
		expect(() => decimalType.parseValue('')).toThrow()
		expect(() => decimalType.parseValue('1,000')).toThrow()
		expect(() => decimalType.parseValue('0x10')).toThrow()
	})

	it('rejects non-finite numbers', () => {
		expect(() => decimalType.parseValue(NaN)).toThrow()
		expect(() => decimalType.parseValue(Infinity)).toThrow()
		expect(() => decimalType.parseValue(-Infinity)).toThrow()
	})

	it('rejects non-string, non-number values', () => {
		expect(() => decimalType.parseValue(true)).toThrow()
		expect(() => decimalType.parseValue(null)).toThrow()
		expect(() => decimalType.parseValue({})).toThrow()
	})

	it('serializes preserving exact text (incl. trailing zeros)', () => {
		// The DB returns the full-scale numeric text representation; it must pass through untouched.
		expect(decimalType.serialize('123.450000000')).toEqual('123.450000000')
		expect(decimalType.serialize('0.000000000')).toEqual('0.000000000')
		expect(decimalType.serialize('-123456789123.456')).toEqual('-123456789123.456')
	})

	it('parses string, int and float literals', () => {
		expect(decimalType.parseLiteral({ kind: Kind.STRING, value: '123.45' } as any, undefined)).toEqual('123.45')
		expect(decimalType.parseLiteral({ kind: Kind.INT, value: '42' } as any, undefined)).toEqual('42')
		expect(decimalType.parseLiteral({ kind: Kind.FLOAT, value: '1.5' } as any, undefined)).toEqual('1.5')
	})

	it('rejects non-numeric literals', () => {
		expect(() => decimalType.parseLiteral({ kind: Kind.BOOLEAN, value: true } as any, undefined)).toThrow()
		expect(() => decimalType.parseLiteral({ kind: Kind.NULL } as any, undefined)).toThrow()
	})
})

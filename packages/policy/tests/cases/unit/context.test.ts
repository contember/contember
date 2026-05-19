import { describe, expect, test } from 'bun:test'
import { readPath, substituteString, substituteValue } from '../../../src'

describe('readPath', () => {
	test('reads simple paths', () => {
		expect(readPath({ a: 1 }, 'a')).toBe(1)
		expect(readPath({ a: { b: { c: 'x' } } }, 'a.b.c')).toBe('x')
	})

	test('returns undefined for missing segments', () => {
		expect(readPath({}, 'a')).toBeUndefined()
		expect(readPath({ a: 1 }, 'a.b.c')).toBeUndefined()
		expect(readPath({ a: null }, 'a.b')).toBeUndefined()
	})

	test('empty path returns root', () => {
		const root = { a: 1 }
		expect(readPath(root, '')).toBe(root)
	})

	test('array indices', () => {
		expect(readPath({ a: [10, 20, 30] }, 'a.1')).toBe(20)
	})
})

describe('substituteString', () => {
	test('substitutes simple placeholder', () => {
		expect(substituteString('hello ${name}', { name: 'world' })).toBe('hello world')
	})

	test('substitutes nested', () => {
		expect(substituteString('${a.b.c}', { a: { b: { c: 'deep' } } })).toBe('deep')
	})

	test('leaves placeholder intact when missing', () => {
		expect(substituteString('${missing}', {})).toBe('${missing}')
	})

	test('multiple placeholders', () => {
		expect(substituteString('${a}/${b}', { a: '1', b: '2' })).toBe('1/2')
	})

	test('coerces non-string', () => {
		expect(substituteString('${n}', { n: 42 })).toBe('42')
	})
})

describe('substituteValue', () => {
	test('substitutes inside arrays', () => {
		expect(substituteValue(['${a}', '${b}'], { a: 'x', b: 'y' })).toEqual(['x', 'y'])
	})

	test('passes through non-strings', () => {
		expect(substituteValue(42, {})).toBe(42)
		expect(substituteValue(true, {})).toBe(true)
		expect(substituteValue(null, {})).toBeNull()
	})
})

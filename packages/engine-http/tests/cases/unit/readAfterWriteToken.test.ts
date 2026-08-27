import { describe, expect, test } from 'bun:test'
import { formatWriteRef, parseReadAfterHeader } from '../../../src/content/readAfterWrite/index.js'

const cluster = '7412094958558216905'
const parse = (value: string | undefined) => parseReadAfterHeader(value, cluster)
const token = (xid: string) => `${cluster}:${xid}`

describe('write ref formatting', () => {
	test('joins the cluster and the transaction id', () => {
		expect(formatWriteRef(cluster, '1054')).toBe(`${cluster}:1054`)
	})
})

describe('read-after header parsing', () => {
	test('a missing header is not a decision', () => {
		expect(parse(undefined)).toBeNull()
	})

	test('an empty header is not a decision', () => {
		expect(parse('')).toBeNull()
		expect(parse('   ')).toBeNull()
		expect(parse(' , ,, ')).toBeNull()
	})

	test('accepts a single token', () => {
		expect(parse(token('1054'))).toStrictEqual({ valid: true, tokens: [token('1054')], xids: ['1054'] })
	})

	test('trims, drops empty entries and keeps the order', () => {
		expect(parse(` ${token('9')} , ${token('7')} ,, ${token('8')} `)).toStrictEqual({
			valid: true,
			tokens: [token('9'), token('7'), token('8')],
			xids: ['9', '7', '8'],
		})
	})

	test('deduplicates repeated tokens', () => {
		expect(parse(`${token('9')},${token('7')},${token('9')}`)).toStrictEqual({
			valid: true,
			tokens: [token('9'), token('7')],
			xids: ['9', '7'],
		})
	})

	test('accepts 16 tokens', () => {
		const tokens = Array.from({ length: 16 }, (_, i) => token(String(i + 3)))
		expect(parse(tokens.join(','))?.valid).toBe(true)
	})

	test('rejects 17 tokens', () => {
		const tokens = Array.from({ length: 17 }, (_, i) => token(String(i + 3)))
		const result = parse(tokens.join(','))
		expect(result).not.toBeNull()
		expect(result?.valid).toBe(false)
		expect(result?.xids).toStrictEqual([])
		expect(result?.tokens).toHaveLength(17)
	})

	test.each([
		['no separator', '1054'],
		['empty cluster part', ':1054'],
		['empty transaction part', `${cluster}:`],
		['a third part', `${cluster}:1054:2`],
		['a non-numeric transaction part', `${cluster}:abc`],
		['a non-numeric cluster part', `abc:1054`],
		['a negative transaction id', `${cluster}:-5`],
		['inner whitespace', `${cluster} : 1054`],
		['a 21-digit transaction id', `${cluster}:${'9'.repeat(21)}`],
	])('rejects %s', (_name, value) => {
		expect(parse(value)?.valid).toBe(false)
	})

	test('rejects a token of another cluster', () => {
		expect(parse('12345:1054')?.valid).toBe(false)
	})

	test('rejects the whole header when one token is foreign', () => {
		expect(parse(`${token('1054')},12345:1055`)?.valid).toBe(false)
	})

	test.each([
		['0', false],
		['1', false],
		['2', false],
		['3', true],
		['18446744073709551615', true],
		['18446744073709551616', false],
	])('transaction id %s is accepted: %s', (xid, accepted) => {
		expect(parse(token(xid))?.valid).toBe(accepted)
	})
})

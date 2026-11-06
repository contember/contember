import { describe, expect, test } from 'bun:test'
import { validateSqlFragment } from '../../../src/index.js'

describe('statement', () => {
	const check = (sql: string) => validateSqlFragment(sql, 'statement')

	test.each([
		['plain query', 'SELECT id, title FROM article WHERE published'],
		['one trailing ;', 'SELECT 1;'],
		['trailing ; followed by whitespace and comments', 'SELECT 1; -- done\n/* end */\n'],
		['; in a string literal', "SELECT ';' AS sep"],
		['doubled quote in a string literal', "SELECT 'it''s; fine'"],
		['; in an escape string', "SELECT E'a\\'; b'"],
		['; in a quoted identifier', 'SELECT 1 AS "a;b"'],
		['doubled quote in a quoted identifier', 'SELECT 1 AS "a"";b"'],
		['; in a $$ body', 'SELECT $$a; b$$'],
		['; in a $tag$ body', 'SELECT $fn$ a; $$ b; $fn$'],
		['; in a line comment', 'SELECT 1 -- a; b\nFROM t'],
		['; in a nested block comment', 'SELECT 1 /* a /* b; */ c; */ FROM t'],
		['positional parameter', 'SELECT $1'],
		['backslash before a quote in a standard string', "SELECT 'a\\'"],
		['string continued on the next line', "SELECT E'a'\n'\\'; b'"],
		['e ending an identifier does not start an escape string', "SELECT abce'\\''; b'"],
	])('accepts %s', (_, sql) => {
		expect(check(sql)).toBeUndefined()
	})

	test.each([
		['two statements', 'SELECT 1; SELECT 2'],
		['two terminators', 'SELECT 1;;'],
		['statement after a string', "SELECT 'x'; DROP TABLE t"],
		['statement after a standard string ending with a backslash', "SELECT 'a\\'; DROP TABLE t; --'"],
		['$ inside an identifier is not a dollar quote', 'SELECT a$$; DROP TABLE t; SELECT $$x$$'],
		['statement after a $tag$ body closed by another tag', 'SELECT $a$ x $b$; DROP TABLE t; $a$; DROP TABLE u'],
		['statement after an escape string', "SELECT e'\\''; DROP TABLE t; --'"],
	])('rejects %s', (_, sql) => {
		expect(check(sql)).toBe('must be a single SQL statement')
	})

	test.each([
		['string literal', "SELECT 'abc", 'string literal'],
		['escape string ending in a backslash', "SELECT E'abc\\", 'string literal'],
		['quoted identifier', 'SELECT "abc', 'quoted identifier'],
		['dollar-quoted body', 'SELECT $x$ abc $y$', 'dollar-quoted string'],
		['block comment', 'SELECT 1 /* a /* b */', 'block comment'],
	])('rejects an unterminated %s', (_, sql, what) => {
		expect(check(sql)).toBe(`contains an unterminated ${what}`)
	})
})

describe('expression', () => {
	const check = (sql: string) => validateSqlFragment(sql, 'expression')

	test('accepts a predicate with ; in a literal', () => {
		expect(check("status <> ';' AND deleted_at IS NULL")).toBeUndefined()
	})

	test('rejects any ;, trailing included', () => {
		expect(check('deleted_at IS NULL;')).toBe('must not contain ";"')
		expect(check('deleted_at IS NULL); DROP TABLE t; --')).toBe('must not contain ";"')
	})

	test('rejects a trailing line comment, which would swallow the closing parenthesis', () => {
		expect(check('deleted_at IS NULL -- live rows')).toBe('must not end with a line comment')
		expect(check('deleted_at IS NULL -- live rows\n')).toBeUndefined()
	})

	test('rejects an unterminated string literal', () => {
		expect(check("status <> 'x")).toBe('contains an unterminated string literal')
	})
})

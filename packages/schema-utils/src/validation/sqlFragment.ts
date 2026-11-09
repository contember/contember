/**
 * Kind of raw SQL fragment embedded into generated migration SQL:
 * - `statement`: the body of a statement (e.g. a view query); one trailing `;` is tolerated,
 * - `expression`: a value wrapped in parentheses (e.g. a partial index predicate); no `;` at all.
 */
export type SqlFragmentKind = 'statement' | 'expression'

// Mirrors the PostgreSQL lexer (scan.l): identifiers may contain `$` and digits, any non-ASCII char is a letter.
const isIdentStart = (ch: string): boolean => /[A-Za-z_]/.test(ch) || ch.charCodeAt(0) >= 0x80
const isIdentCont = (ch: string): boolean => /[A-Za-z0-9_$]/.test(ch) || ch.charCodeAt(0) >= 0x80
const isDollarTagCont = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch) || ch.charCodeAt(0) >= 0x80
const isSpace = (ch: string): boolean => /[ \t\n\r\f\v]/.test(ch)
const isHorizSpace = (ch: string): boolean => /[ \t\f\v]/.test(ch)
const isNewline = (ch: string): boolean => ch === '\n' || ch === '\r'

class UnterminatedError {
	constructor(public readonly what: string) {}
}

/**
 * Checks that a raw SQL fragment cannot terminate the statement it is embedded into. Migrations run as one
 * multi-statement string, so the database does not refuse a second statement; this check does.
 * String literals, quoted identifiers, dollar-quoted bodies and comments are skipped; anything left
 * unterminated is rejected, because it would swallow the SQL that follows the fragment.
 * Assumes `standard_conforming_strings = on` (the PostgreSQL default).
 *
 * Returns an error message, or undefined when the fragment is acceptable.
 */
export const validateSqlFragment = (sql: string, kind: SqlFragmentKind): string | undefined => {
	const terminators: number[] = []
	let endsInLineComment = false
	try {
		let i = 0
		while (i < sql.length) {
			const ch = sql[i]
			const next = sql[i + 1]
			endsInLineComment = false
			if (ch === '-' && next === '-') {
				i = skipLineComment(sql, i)
				endsInLineComment = i >= sql.length
			} else if (ch === '/' && next === '*') {
				i = skipBlockComment(sql, i)
			} else if (ch === "'") {
				i = skipStringLiteral(sql, i, false)
			} else if (ch === '"') {
				i = skipQuotedIdentifier(sql, i)
			} else if (ch === '$') {
				i = skipDollarQuoted(sql, i)
			} else if (isIdentStart(ch)) {
				if ((ch === 'e' || ch === 'E') && next === "'") {
					i = skipStringLiteral(sql, i + 1, true)
				} else {
					i++
					while (i < sql.length && isIdentCont(sql[i])) {
						i++
					}
				}
			} else if (/[0-9]/.test(ch)) {
				i = skipNumber(sql, i)
			} else {
				if (ch === ';') {
					terminators.push(i)
				}
				i++
			}
		}
	} catch (e) {
		if (e instanceof UnterminatedError) {
			return `contains an unterminated ${e.what}`
		}
		throw e
	}

	if (kind === 'expression') {
		if (terminators.length > 0) {
			return 'must not contain ";"'
		}
		if (endsInLineComment) {
			return 'must not end with a line comment'
		}
		return undefined
	}
	if (terminators.length > 1 || (terminators.length === 1 && !isTrailing(sql, terminators[0] + 1))) {
		return 'must be a single SQL statement'
	}
	return undefined
}

/** Only whitespace and comments follow `from`. */
const isTrailing = (sql: string, from: number): boolean => {
	let i = from
	while (i < sql.length) {
		if (isSpace(sql[i])) {
			i++
		} else if (sql.startsWith('--', i)) {
			i = skipLineComment(sql, i)
		} else if (sql.startsWith('/*', i)) {
			i = skipBlockComment(sql, i)
		} else {
			return false
		}
	}
	return true
}

const skipLineComment = (sql: string, start: number): number => {
	let i = start + 2
	while (i < sql.length && !isNewline(sql[i])) {
		i++
	}
	return i
}

const skipBlockComment = (sql: string, start: number): number => {
	let depth = 1
	let i = start + 2
	while (i < sql.length) {
		if (sql[i] === '/' && sql[i + 1] === '*') {
			depth++
			i += 2
		} else if (sql[i] === '*' && sql[i + 1] === '/') {
			depth--
			i += 2
			if (depth === 0) {
				return i
			}
		} else {
			i++
		}
	}
	throw new UnterminatedError('block comment')
}

/** `start` points at the opening quote. Adjacent literals separated by a newline continue in the same mode. */
const skipStringLiteral = (sql: string, start: number, escapes: boolean): number => {
	let i = start + 1
	while (i < sql.length) {
		const ch = sql[i]
		if (escapes && ch === '\\') {
			i += 2
		} else if (ch === "'") {
			if (sql[i + 1] === "'") {
				i += 2
				continue
			}
			const continuation = findStringContinuation(sql, i + 1)
			if (continuation === undefined) {
				return i + 1
			}
			i = continuation + 1
		} else {
			i++
		}
	}
	throw new UnterminatedError('string literal')
}

/** Position of the quote continuing a literal (`'a'` newline `'b'`, comments allowed), see `quotecontinue` in scan.l. */
const findStringContinuation = (sql: string, from: number): number | undefined => {
	let i = from
	while (i < sql.length) {
		if (isHorizSpace(sql[i])) {
			i++
		} else if (sql.startsWith('--', i)) {
			i = skipLineComment(sql, i)
		} else {
			break
		}
	}
	if (i >= sql.length || !isNewline(sql[i])) {
		return undefined
	}
	i++
	while (i < sql.length) {
		if (isSpace(sql[i])) {
			i++
		} else if (sql.startsWith('--', i)) {
			const end = skipLineComment(sql, i)
			if (end >= sql.length) {
				return undefined
			}
			i = end
		} else {
			break
		}
	}
	return sql[i] === "'" ? i : undefined
}

const skipQuotedIdentifier = (sql: string, start: number): number => {
	let i = start + 1
	while (i < sql.length) {
		if (sql[i] === '"') {
			if (sql[i + 1] === '"') {
				i += 2
				continue
			}
			return i + 1
		}
		i++
	}
	throw new UnterminatedError('quoted identifier')
}

/** `start` points at `$`; a `$` not opening a `$tag$` / `$$` delimiter (e.g. a `$1` parameter) is a single char. */
const skipDollarQuoted = (sql: string, start: number): number => {
	let i = start + 1
	if (i < sql.length && isIdentStart(sql[i])) {
		while (i < sql.length && isDollarTagCont(sql[i])) {
			i++
		}
	}
	if (sql[i] !== '$') {
		return start + 1
	}
	const delimiter = sql.slice(start, i + 1)
	const end = sql.indexOf(delimiter, i + 1)
	if (end < 0) {
		throw new UnterminatedError('dollar-quoted string')
	}
	return end + delimiter.length
}

/** Digits, `_` separators and a decimal point; an exponent only with its digits, so `1e'…'` leaves `e'` to be lexed as in PostgreSQL. */
const skipNumber = (sql: string, start: number): number => {
	let i = start
	while (i < sql.length && /[0-9_.]/.test(sql[i])) {
		i++
	}
	if ((sql[i] === 'e' || sql[i] === 'E') && /^[+-]?[0-9]/.test(sql.slice(i + 1, i + 3))) {
		i += 2
		while (i < sql.length && /[0-9]/.test(sql[i])) {
			i++
		}
	}
	return i
}

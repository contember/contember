import { JSONValue } from '@contember/schema'
import { validateSqlFragment } from '@contember/schema-utils'

/**
 * Checks the raw SQL of each `{ literal: true, value }` (node-pg-migrate's PgLiteral) in a column default or fill value,
 * including inside arrays: `escapeValue` emits it unescaped. Mirrors `escapeValue`, which stringifies any non-number value.
 * Returns an error message, or undefined when the value carries no unsafe raw SQL.
 */
export const validateLiteralSql = (value: JSONValue | undefined): string | undefined => {
	if (Array.isArray(value)) {
		for (const item of value) {
			const error = validateLiteralSql(item)
			if (error) {
				return error
			}
		}
		return undefined
	}
	if (typeof value !== 'object' || value === null || !('literal' in value) || value.literal !== true || !('value' in value)) {
		return undefined
	}
	if (typeof value.value === 'number') {
		return undefined
	}
	const error = validateSqlFragment(`${value.value}`, 'expression')
	return error ? `raw SQL literal ${error}` : undefined
}

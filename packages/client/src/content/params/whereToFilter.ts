import type { Input } from '@contember/schema'
import { GraphQlLiteral } from '../../graphQlBuilder'

export const whereToFilter = (
	by: Input.UniqueWhere<GraphQlLiteral>,
): Input.Where<Input.Condition<Input.ColumnValue<GraphQlLiteral>>> => {
	const where: Input.Where<Input.Condition<Input.ColumnValue<GraphQlLiteral>>> = {}
	for (const key in by) {
		const value = by[key]

		if (value instanceof GraphQlLiteral || typeof value === 'string' || typeof value === 'number') {
			where[key] = { eq: value }
		} else {
			where[key] = whereToFilter(value)
		}
	}

	return where
}

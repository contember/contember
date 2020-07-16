import { Input } from '@contember/schema'
import { Literal } from '../../graphQlBuilder'

export const whereToFilter = (
	by: Input.UniqueWhere<Literal>,
): Input.Where<Input.Condition<Input.ColumnValue<Literal>>> => {
	const where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>> = {}
	for (const key in by) {
		const value = by[key]

		if (value instanceof Literal || typeof value === 'string' || typeof value === 'number') {
			where[key] = { eq: value }
		} else {
			where[key] = whereToFilter(value)
		}
	}

	return where
}

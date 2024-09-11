import type { Input, Writable } from '@contember/schema'

export const whereToFilter = (
	by: Input.UniqueWhere,
): Input.Where<Input.Condition<Input.ColumnValue>> => {
	const where: Writable<Input.Where<Input.Condition<Input.ColumnValue>>> = {}
	for (const key in by) {
		const value = by[key]

		if (typeof value === 'string' || typeof value === 'number') {
			where[key] = { eq: value }
		} else {
			where[key] = whereToFilter(value)
		}
	}

	return where
}

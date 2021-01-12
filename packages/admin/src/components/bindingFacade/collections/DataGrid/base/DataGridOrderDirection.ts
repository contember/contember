import { GraphQlBuilder } from '@contember/client'
import { assertNever } from '@contember/utils'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export type DataGridOrderDirection = 'asc' | 'desc' | undefined

export const getOrderDirection = (order: SingleColumnOrderBy | undefined): DataGridOrderDirection => {
	if (order === undefined) {
		return undefined
	}
	// This "loop" doesn't loop but that's deliberate.
	for (const fieldName in order) {
		const value = order[fieldName]
		if (value instanceof GraphQlBuilder.Literal) {
			return value.value
		}
		return getOrderDirection(value)
	}
}

export const toggleOrderDirection = (direction: DataGridOrderDirection): DataGridOrderDirection => {
	if (direction === undefined) {
		return 'asc'
	}
	if (direction === 'asc') {
		return 'desc'
	}
	if (direction === 'desc') {
		return undefined
	}
	return assertNever(direction)
}

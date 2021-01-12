import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export const getOrderDirection = (
	order: SingleColumnOrderBy | undefined,
): CrudQueryBuilder.OrderDirection | undefined => {
	if (order === undefined) {
		return undefined
	}
	// This "loop" doesn't loop but that's deliberate.
	for (const fieldName in order) {
		const value = order[fieldName]
		if (value instanceof GraphQlBuilder.Literal) {
			return value
		}
		return getOrderDirection(value)
	}
}

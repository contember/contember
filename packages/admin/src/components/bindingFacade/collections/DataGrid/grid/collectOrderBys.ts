import { OrderBy } from '@contember/binding'
import { DataGridColumns, DataGridOrderBys, SingleColumnOrderBy } from '../base'

export const collectOrderBys = (columns: DataGridColumns, orderBys: DataGridOrderBys): OrderBy | undefined => {
	// TODO the first implementation respects insertion order whereas the other one uses column order.
	// 	which is better?
	const orderings = Array.from(orderBys.values())
	// const orderings = Array.from(columns.keys(), key => orderBys.get(key)).filter(
	// 	(item): item is SingleColumnOrderBy => !!item,
	// )

	return orderings.length ? orderings : undefined
}

import { OrderBy } from '@contember/binding'
import { DataGridOrderBys } from '../base'

export const collectOrderBys = (orderBys: DataGridOrderBys): OrderBy | undefined => {
	const orderings = Array.from(orderBys.values())

	return orderings.length ? orderings : undefined
}

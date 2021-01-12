import { OrderBy } from '@contember/binding'
import { DataGridOrderBys } from '../base'

export const collectOrderBys = (orderBys: DataGridOrderBys): OrderBy | undefined => {
	const orderings = Array.from(orderBys.values()).flat(1)

	return orderings.length ? orderings : undefined
}

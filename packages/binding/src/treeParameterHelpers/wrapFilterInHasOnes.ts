import { whereToFilter } from '@contember/client'
import { Filter, HasOneRelation } from '../treeParameters'

export const wrapFilterInHasOnes = (path: HasOneRelation[], filter: Filter): Filter => {
	for (let i = path.length - 1; i >= 0; i--) {
		const current = path[i]

		if (current.reducedBy === undefined) {
			filter = {
				[current.field]: filter,
			}
		} else {
			filter = {
				[current.field]: {
					and: [filter, whereToFilter(current.reducedBy)],
				},
			}
		}
	}
	return filter
}

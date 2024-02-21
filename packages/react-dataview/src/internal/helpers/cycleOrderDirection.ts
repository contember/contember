import { assertNever } from '@contember/utilities'
import { DataViewSortingDirection } from '../../types/sorting'


export const cycleOrderDirection = (direction: DataViewSortingDirection): DataViewSortingDirection => {
	if (direction === null) {
		return 'asc'
	}
	if (direction === 'asc') {
		return 'desc'
	}
	if (direction === 'desc') {
		return null
	}
	return assertNever(direction)
}

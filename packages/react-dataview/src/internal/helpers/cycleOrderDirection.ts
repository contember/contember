import { assertNever } from '@contember/utilities'
import { DataViewOrderDirection } from '../../types/sorting'


export const cycleOrderDirection = (direction: DataViewOrderDirection): DataViewOrderDirection => {
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

import { assertNever } from '@contember/utilities'
import { DataGridOrderDirection } from '../types'


export const cycleOrderDirection = (direction: DataGridOrderDirection): DataGridOrderDirection => {
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

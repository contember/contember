import { assertNever } from '@contember/utils'

export type DataGridOrderDirection = 'asc' | 'desc' | undefined

export const cycleOrderDirection = (direction: DataGridOrderDirection): DataGridOrderDirection => {
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

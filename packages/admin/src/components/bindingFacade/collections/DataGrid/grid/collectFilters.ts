import { Filter } from '@contember/binding'
import { DataGridFilters } from '../base'

export const collectFilters = (filters: DataGridFilters): Filter | undefined => {
	const mapped = Array.from(filters.values())

	if (mapped.length === 0) {
		return undefined
	}
	if (mapped.length === 1) {
		return mapped[0]
	}
	return { and: mapped }
}

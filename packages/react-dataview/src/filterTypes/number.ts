import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: number | null
	nullCondition: boolean
}

export const createNumberFilter = createFieldFilterHandler<NumberFilterArtifacts>({
	createCondition: filter => {
		const baseOperators = {
			eq: 'eq',
			gte: 'gte',
			lte: 'lte',
		}

		const conditions: Input.Condition[] = []
		if (filter.query !== null) {
			conditions.push({
				[baseOperators[filter.mode]]: filter.query,
			})
		}
		if (filter.nullCondition) {
			conditions.push({ isNull: true })
		}

		return { or: conditions }
	},
	isEmpty: filter => {
		return filter.query === null && !filter.nullCondition
	},
})

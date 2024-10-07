import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type NumberRangeFilterArtifacts = {
	from?: number
	to?: number
	nullCondition?: boolean
}

export const createNumberRangeFilter = createFieldFilterHandler<NumberRangeFilterArtifacts>({
	createCondition: filter => {
		const inclusion: Input.Condition[] = []
		const exclusion: Input.Condition[] = []
		if (filter.from !== undefined || filter.to !== undefined) {
			inclusion.push({
				gte: filter.from,
				lte: filter.to,
			},
			)
		}
		if (filter.nullCondition === true) {
			inclusion.push({ isNull: true })
		}
		if (filter.nullCondition === false) {
			exclusion.push({ isNull: false })
		}

		return {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		}
	},
	isEmpty: filter => {
		return filter.from === undefined && filter.to === undefined && filter.nullCondition === undefined
	},
})

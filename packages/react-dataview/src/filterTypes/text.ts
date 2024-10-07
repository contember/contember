import { createGenericTextCellFilterCondition } from './common'
import { createFieldFilterHandler } from './createFilterHandler'

export type TextFilterArtifactsMatchMode = 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'

export type TextFilterArtifacts = {
	mode?: TextFilterArtifactsMatchMode
	query?: string
	nullCondition?: boolean
}


export const createTextFilter = createFieldFilterHandler<TextFilterArtifacts>({
	createCondition: filter => {
		const condition = filter.query !== '' ? createGenericTextCellFilterCondition(filter) : {}

		if (filter.nullCondition === true) {
			return {
				or: [condition, { isNull: true }],
			}
		} else if (filter.nullCondition === false) {
			return {
				and: [condition, { isNull: false }],
			}
		}

		return condition
	},
	isEmpty: filter => {
		return !filter.query && filter.nullCondition === undefined
	},
})

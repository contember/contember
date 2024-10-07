import { createFieldFilterHandler } from './createFilterHandler'

export type IsDefinedFilterArtifacts = {
	nullCondition?: boolean
}

export const createIsDefinedFilter = createFieldFilterHandler<IsDefinedFilterArtifacts>({
	createCondition: filter => {
		return filter.nullCondition === true ? { isNull: true } : filter.nullCondition === false ? { isNull: false } : {}
	},
	isEmpty: filter => {
		return filter.nullCondition === undefined
	},
})

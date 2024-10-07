import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type BooleanFilterArtifacts = {
	includeTrue?: boolean
	includeFalse?: boolean
	nullCondition?: boolean
}

export const createBooleanFilter = createFieldFilterHandler<BooleanFilterArtifacts>({
	createCondition: filter => {
		const inclusion: Input.Condition[] = []
		const exclusion: Input.Condition[] = []
		if (filter.includeTrue) {
			inclusion.push({ eq: true })
		}
		if (filter.includeFalse) {
			inclusion.push({ eq: false })
		}
		if (filter.nullCondition === true) {
			inclusion.push({ isNull: true })
		}
		if (filter.nullCondition === false) {
			exclusion.push({ isNull: false })
		}

		if (inclusion.length === 0 && exclusion.length === 0) {
			return undefined
		}
		return {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		}
	},
	isEmpty: filter => {
		return !filter.includeTrue && !filter.includeFalse && filter.nullCondition === undefined
	},
})

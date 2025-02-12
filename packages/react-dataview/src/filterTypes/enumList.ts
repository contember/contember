import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type EnumListFilterArtifacts = {
	values?: string[]
	notValues?: string[]
	nullCondition?: boolean
}

export const createEnumListFilter = createFieldFilterHandler<EnumListFilterArtifacts>({
	createCondition: filter => {
		const { values, notValues, nullCondition } = filter

		const inclusion: Input.Condition<string>[] = []
		const exclusion: Input.Condition<string>[] = []

		if (nullCondition === true) {
			inclusion.push({ isNull: true })
		}

		if (nullCondition === false) {
			exclusion.push({ isNull: false })
		}

		if (values?.length) {
			inclusion.push(...values.map(value => ({ includes: value })))
		}

		if (notValues?.length) {
			exclusion.push(...notValues.map(value => ({ not: { includes: value } })))
		}

		return {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		}
	},
	isEmpty: filterArtifact => {
		return !filterArtifact.values?.length
			&& !filterArtifact.notValues?.length
			&& filterArtifact.nullCondition === undefined
	},
})

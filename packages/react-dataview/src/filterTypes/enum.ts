import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type EnumFilterArtifacts = {
	values?: string[]
	notValues?: string[]
	nullCondition?: boolean
}

export const createEnumFilter = createFieldFilterHandler<EnumFilterArtifacts>({
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
			inclusion.push({ in: values })
		}
		if (notValues?.length) {
			exclusion.push({ notIn: notValues })
		}
		return {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		}
	},
	isEmpty: filterArtifact => {
		return !filterArtifact.values?.length && filterArtifact.nullCondition === undefined && !filterArtifact.notValues?.length
	},
})

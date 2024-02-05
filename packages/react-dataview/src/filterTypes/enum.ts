import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type EnumFilterArtifacts = {
	values?: string[]
	notValues?: string[]
	nullCondition?: boolean
}

export const createEnumFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<EnumFilterArtifacts> => (filter, { environment }) => {
	const { values, notValues, nullCondition } = filter

	if (!values?.length && nullCondition === undefined && !notValues?.length) {
		return undefined
	}
	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)

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


	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		},
	})
}

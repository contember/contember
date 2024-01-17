import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type EnumCellFilterArtifacts = {
	values: string[]
	nullCondition: boolean
}

export const createEnumFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<EnumCellFilterArtifacts> => (filter, { environment }) => {
	const { values, nullCondition = false } = filter

	if (values.length === 0 && !nullCondition) {
		return undefined
	}
	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)

	const conditions: Input.Condition<string>[] = []

	if (nullCondition) {
		conditions.push({ isNull: true })
	}

	conditions.push({
		in: values,
	})

	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: { or: conditions },
	})
}

import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type EnumFilterArtifacts = {
	values?: string[]
	notValues?: string[]
	nullCondition?: boolean
}

const id = Symbol('enum')

export const createEnumFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<EnumFilterArtifacts> => {
	const handler: DataViewFilterHandler<EnumFilterArtifacts> = (filter, { environment }) => {
		const { values, notValues, nullCondition } = filter
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

	handler.identifier = { id, params: { field } }
	handler.isEmpty = filterArtifact => {
		return !filterArtifact.values?.length && filterArtifact.nullCondition === undefined && !filterArtifact.notValues?.length
	}

	return handler
}

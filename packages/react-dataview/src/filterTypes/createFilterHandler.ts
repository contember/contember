import { Filter, QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import { DataViewFilterArtifact, DataViewFilterHandler, DataViewFilterHandlerOptions } from '../types'
import { Input } from '@contember/client'

export const createFilterHandler = <FA extends DataViewFilterArtifact = DataViewFilterArtifact>({ createFilter, isEmpty, identifier }: {
	createFilter: ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Filter | undefined)
	isEmpty?: (filterArtifact: FA) => boolean
	identifier?: { id: Symbol; params: any }
}): DataViewFilterHandler<FA> => {
	const handler: DataViewFilterHandler<FA> = (filterArtifact, options) => {
		return createFilter(filterArtifact, options)
	}
	handler.identifier = identifier
	handler.isEmpty = isEmpty
	return handler
}

/**
 * Simplifies the creation of a filter handler for a field filter.
 */
export const createFieldFilterHandler = <FA extends DataViewFilterArtifact = DataViewFilterArtifact>({ createCondition, isEmpty }: {
	createCondition: ((filterArtifact: FA, options: DataViewFilterHandlerOptions) => Input.Condition | undefined)
	isEmpty?: (filterArtifact: FA) => boolean
}) => {
	const id = Symbol()
	return (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<FA> => {
		return createFilterHandler<FA>({
			createFilter: (filter, options) => {
				const condition = createCondition(filter, options)
				if (!condition) {
					return undefined
				}
				const desugared = QueryLanguage.desugarRelativeSingleField(field, options.environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			},
			isEmpty,
			identifier: { id, params: { field } },
		})
	}
}

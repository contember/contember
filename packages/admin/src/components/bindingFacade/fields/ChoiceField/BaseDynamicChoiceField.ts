import {
	BoxedQualifiedEntityList,
	EntityAccessor,
	Environment,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleField,
	useAccessorUpdateSubscription,
	useEnvironment,
	useGetSubTree,
} from '@contember/binding'
import { emptyArray } from '@contember/react-utils'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export type BaseDynamicChoiceField = (
	| {
			renderOption: (entityAccessor: EntityAccessor) => React.ReactNode
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionsStaticRender: React.ReactElement | ((environment: Environment) => React.ReactElement)
	  }
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
	  }
) & {
	searchByFields?: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
}

export const useDesugaredOptionPath = (props: BaseDynamicChoiceField) => {
	const environment = useEnvironment()
	return React.useMemo<QualifiedFieldList | QualifiedEntityList>(() => {
		if ('optionsStaticRender' in props) {
			return QueryLanguage.desugarQualifiedEntityList(
				typeof props.options === 'string' || !('entities' in props.options)
					? {
							entities: props.options,
					  }
					: props.options,
				environment,
			)
		}
		return QueryLanguage.desugarQualifiedFieldList(
			typeof props.options === 'string' || !('fields' in props.options)
				? {
						fields: props.options,
				  }
				: props.options,
			environment,
		)
	}, [environment, props])
}

export const useTopLevelOptionAccessors = (desugaredOptionPath: QualifiedFieldList | QualifiedEntityList) => {
	const getSubTree = useGetSubTree()
	const getSubTreeData = React.useCallback(() => getSubTree(new BoxedQualifiedEntityList(desugaredOptionPath)), [
		desugaredOptionPath,
		getSubTree,
	])
	const subTreeData = useAccessorUpdateSubscription(getSubTreeData)
	return React.useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

export const useOptionEntities = (
	topLevelOptionAccessors: EntityAccessor[],
	desugaredOptionPath: QualifiedFieldList | QualifiedEntityList,
) =>
	React.useMemo(() => {
		const entities: EntityAccessor[] = []
		for (const entity of topLevelOptionAccessors) {
			entities.push(entity.getRelativeSingleEntity(desugaredOptionPath))
		}
		return entities
	}, [desugaredOptionPath, topLevelOptionAccessors])

export const useCurrentValues = (
	currentlyChosenEntities: EntityAccessor[],
	topLevelOptionAccessors: EntityAccessor[],
) =>
	React.useMemo(() => {
		const values: ChoiceFieldData.ValueRepresentation[] = []

		for (const entity of currentlyChosenEntities) {
			const currentKey = entity.key
			const index = topLevelOptionAccessors.findIndex((entity: EntityAccessor) => {
				const key = entity.primaryKey
				return !!key && key === currentKey
			})
			if (index > -1) {
				values.push(index)
			}
		}

		return values
	}, [currentlyChosenEntities, topLevelOptionAccessors])

export const useNormalizedOptions = (
	optionEntities: EntityAccessor[],
	desugaredOptionPath: QualifiedFieldList | QualifiedEntityList,
	renderOption: ((entityAccessor: EntityAccessor) => React.ReactNode) | undefined,
	searchByFields: BaseDynamicChoiceField['searchByFields'],
) => {
	const sugaredFields = React.useMemo(
		() => (searchByFields === undefined ? [] : Array.isArray(searchByFields) ? searchByFields : [searchByFields]),
		[searchByFields],
	)
	const environment = useEnvironment()
	const desugaredFields = React.useMemo(
		() => sugaredFields.map(field => QueryLanguage.desugarRelativeSingleField(field, environment)),
		[sugaredFields, environment],
	)
	return React.useMemo(
		() =>
			optionEntities.map(
				(item, i): ChoiceFieldData.SingleDatum => {
					const label = renderOption
						? renderOption(item)
						: 'field' in desugaredOptionPath
						? `${item.getField(desugaredOptionPath.field).currentValue ?? ''}`
						: ''

					let searchKeywords: string

					if (desugaredFields.length) {
						searchKeywords = desugaredFields
							.map(desugared => item.getRelativeSingleField<string>(desugared).currentValue ?? '')
							.join(' ')
					} else if (typeof label === 'string') {
						searchKeywords = label
					} else {
						// TODO we're failing silently which is not ideal but at the same time it's not correct to throw.
						searchKeywords = ''
					}

					return {
						key: i,
						label,
						searchKeywords,
						actualValue: item.key,
					}
				},
			),
		[desugaredOptionPath, optionEntities, renderOption, desugaredFields],
	)
}

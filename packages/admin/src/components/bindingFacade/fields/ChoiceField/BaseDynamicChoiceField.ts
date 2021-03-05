import {
	EntityAccessor,
	Environment,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	useAccessorUpdateSubscription,
	useEnvironment,
	useGetEntityListSubTree,
} from '@contember/binding'
import { ReactElement, ReactNode, useCallback, useMemo } from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export type BaseDynamicChoiceField = (
	| {
			renderOption: (entityAccessor: EntityAccessor) => ReactNode
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionsStaticRender: ReactElement | ((environment: Environment) => ReactElement)
	  }
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
	  }
) & {
	searchByFields?: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
}

export const useDesugaredOptionPath = (props: BaseDynamicChoiceField) => {
	const environment = useEnvironment()
	return useMemo<QualifiedFieldList | QualifiedEntityList>(() => {
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
	const getSubTree = useGetEntityListSubTree()
	const entityList = useMemo<SugaredQualifiedEntityList>(() => ({ entities: desugaredOptionPath }), [
		desugaredOptionPath,
	])
	const getSubTreeData = useCallback(() => getSubTree(entityList), [entityList, getSubTree])
	const subTreeData = useAccessorUpdateSubscription(getSubTreeData)
	return useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

export const useOptionEntities = (
	topLevelOptionAccessors: EntityAccessor[],
	desugaredOptionPath: QualifiedFieldList | QualifiedEntityList,
) =>
	useMemo(() => {
		const relativeEntity: SugaredRelativeSingleEntity = { field: desugaredOptionPath.hasOneRelationPath }
		const entities: EntityAccessor[] = []
		for (const entity of topLevelOptionAccessors) {
			entities.push(entity.getEntity(relativeEntity))
		}
		return entities
	}, [desugaredOptionPath.hasOneRelationPath, topLevelOptionAccessors])

export const useCurrentValues = (
	currentlyChosenEntities: EntityAccessor[],
	topLevelOptionAccessors: EntityAccessor[],
) =>
	useMemo(() => {
		const values: ChoiceFieldData.ValueRepresentation[] = []

		for (const entity of currentlyChosenEntities) {
			const currentId = entity.id
			const index = topLevelOptionAccessors.findIndex((entity: EntityAccessor) => {
				const id = entity.id
				return !!id && id === currentId
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
	renderOption: ((entityAccessor: EntityAccessor) => ReactNode) | undefined,
	searchByFields: BaseDynamicChoiceField['searchByFields'],
) => {
	const sugaredFields = useMemo(
		() => (searchByFields === undefined ? [] : Array.isArray(searchByFields) ? searchByFields : [searchByFields]),
		[searchByFields],
	)
	const environment = useEnvironment()
	const desugaredFields = useMemo(
		() => sugaredFields.map(field => QueryLanguage.desugarRelativeSingleField(field, environment)),
		[sugaredFields, environment],
	)
	return useMemo(
		() =>
			optionEntities.map(
				(item, i): ChoiceFieldData.SingleDatum => {
					const label = renderOption
						? renderOption(item)
						: 'field' in desugaredOptionPath
						? `${item.getField(desugaredOptionPath.field).value ?? ''}`
						: ''

					let searchKeywords: string

					if (desugaredFields.length) {
						searchKeywords = desugaredFields
							.map(desugared => item.getRelativeSingleField<string>(desugared).value ?? '')
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
						actualValue: item.id,
					}
				},
			),
		[desugaredOptionPath, optionEntities, renderOption, desugaredFields],
	)
}

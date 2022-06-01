import {
	Entity,
	EntityAccessor,
	EntityId,
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
import type { ChoiceFieldData } from './ChoiceFieldData'

/** @deprecated */
interface LegacyChoiceFieldWithOptionRenderer {
	renderOption: (entityAccessor: EntityAccessor) => ReactNode
	options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
	optionsStaticRender: ReactElement | ((environment: Environment) => ReactElement)
}

export type BaseDynamicChoiceField = (
	| {
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionLabel: ReactNode
		}
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
		}
	| LegacyChoiceFieldWithOptionRenderer

) & {
	searchByFields?: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
	createNewForm?: ReactElement
}

export const useDesugaredOptionPath = (props: BaseDynamicChoiceField) => {
	const environment = useEnvironment()
	return useMemo<QualifiedFieldList | QualifiedEntityList>(() => {
		if ('optionsStaticRender' in props || 'optionLabel' in props) {
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
	const entityList = useMemo<SugaredQualifiedEntityList>(
		() => ({ entities: desugaredOptionPath, ...desugaredOptionPath }),
		[desugaredOptionPath],
	)
	const getSubTreeData = useCallback(() => getSubTree(entityList), [entityList, getSubTree])
	const subTreeData = useAccessorUpdateSubscription(getSubTreeData)
	return useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

export const useOptionEntities = (
	optionAccessors: EntityAccessor[],
	desugaredOptionPath: QualifiedFieldList | QualifiedEntityList,
) =>
	useMemo(() => {
		const relativeEntity: SugaredRelativeSingleEntity = { field: desugaredOptionPath.hasOneRelationPath }
		const entities: EntityAccessor[] = []
		for (const entity of optionAccessors) {
			entities.push(entity.getEntity(relativeEntity))
		}
		return entities
	}, [desugaredOptionPath.hasOneRelationPath, optionAccessors])

export const useMergeEntities = (
	currentlyChosenEntities: EntityAccessor[],
	topLevelOptionAccessors: EntityAccessor[],
) =>
	useMemo(() => {
		const ids = new Set(topLevelOptionAccessors.map(it => it.id))
		return [
			...topLevelOptionAccessors,
			...currentlyChosenEntities.filter(it => !ids.has(it.id)),
		]
	}, [currentlyChosenEntities, topLevelOptionAccessors])

export const useCurrentValues = (
	currentlyChosenEntities: EntityAccessor[],
	optionAccessors: EntityAccessor[],
) => {
	const idKeyMap = useMemo(() => {
		const idKeyMap = new Map<EntityId, ChoiceFieldData.ValueRepresentation>()
		optionAccessors.forEach((entity, index) =>
			idKeyMap.set(entity.id, index),
		)
		return idKeyMap
	}, [optionAccessors])

	return useMemo(() => {
		const values: ChoiceFieldData.ValueRepresentation[] = []

		for (const entity of currentlyChosenEntities) {
			const index = idKeyMap.get(entity.id)
			if (index !== undefined) {
				values.push(index)
			}
		}

		return values
	}, [currentlyChosenEntities, idKeyMap])
}

export const useNormalizedOptions = (
	optionEntities: EntityAccessor[],
	desugaredOptionPath: QualifiedFieldList | QualifiedEntityList,
	renderOption: ((entityAccessor: EntityAccessor) => ReactNode) | undefined,
	optionLabel: ReactElement | undefined,
	searchByFields: BaseDynamicChoiceField['searchByFields'],
): ChoiceFieldData.Data => {
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
			optionEntities.map((item, i): ChoiceFieldData.SingleDatum => {
				let label
				if (renderOption) {
					label = renderOption(item)
				} else if (optionLabel) {
					label = <Entity accessor={item}>{optionLabel}</Entity>
				} else if ('field' in desugaredOptionPath) {
					label = `${item.getField(desugaredOptionPath.field).value ?? ''}`
				} else {
					label = ''
				}

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
			}),
		[optionEntities, renderOption, optionLabel, desugaredOptionPath, desugaredFields],
	)
}

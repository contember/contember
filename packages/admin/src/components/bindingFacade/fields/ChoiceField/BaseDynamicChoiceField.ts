import {
	BoxedQualifiedEntityList,
	EntityAccessor,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	useAccessorUpdateSubscription__UNSTABLE,
	useEnvironment,
	useGetSubTree,
} from '@contember/binding'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export type BaseDynamicChoiceField =
	| {
			renderOptionText: (entityAccessor: EntityAccessor) => string
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionFieldStaticFactory: React.ReactNode
	  }
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
	  }

export const useDesugaredOptionPath = (props: BaseDynamicChoiceField) => {
	const environment = useEnvironment()
	return React.useMemo<QualifiedFieldList | QualifiedEntityList>(() => {
		if ('renderOptionText' in props) {
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
	const subTreeData = useAccessorUpdateSubscription__UNSTABLE(getSubTreeData)
	return Array.from(subTreeData)
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
	renderOptionText: ((entityAccessor: EntityAccessor) => string) | undefined,
) =>
	React.useMemo(
		() =>
			optionEntities.map(
				(item, i): ChoiceFieldData.SingleDatum => {
					const label = renderOptionText
						? renderOptionText(item)
						: 'field' in desugaredOptionPath
						? `${item.getRelativeSingleField(desugaredOptionPath.field).currentValue ?? ''}`
						: ''

					return {
						key: i,
						label,
						actualValue: item.key,
					}
				},
			),
		[desugaredOptionPath, optionEntities, renderOptionText],
	)

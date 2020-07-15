import {
	BoxedQualifiedEntityList,
	EntityAccessor,
	Environment,
	QualifiedEntityList,
	QualifiedFieldList,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	useAccessorUpdateSubscription,
	useEnvironment,
	useGetSubTree,
} from '@contember/binding'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export type BaseDynamicChoiceField =
	| {
			getSearchKeywords?: (entityAccessor: EntityAccessor) => string | null | Array<string | null>
			renderOption: (entityAccessor: EntityAccessor) => React.ReactNode
			options: string | SugaredQualifiedEntityList['entities'] | SugaredQualifiedEntityList
			optionsStaticRender: React.ReactElement | ((environment: Environment) => React.ReactElement)
	  }
	| {
			options: string | SugaredQualifiedFieldList['fields'] | SugaredQualifiedFieldList
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
	renderOption: ((entityAccessor: EntityAccessor) => React.ReactNode) | undefined,
	getSearchKeywords: ((entityAccessor: EntityAccessor) => string | null | Array<string | null>) | undefined,
) =>
	React.useMemo(
		() =>
			optionEntities.map(
				(item, i): ChoiceFieldData.SingleDatum => {
					const label = renderOption
						? renderOption(item)
						: 'field' in desugaredOptionPath
						? `${item.getField(desugaredOptionPath.field).currentValue ?? ''}`
						: ''

					let searchKeywords: string

					if (getSearchKeywords) {
						let keywords = getSearchKeywords(item)
						if (!Array.isArray(keywords)) {
							keywords = [keywords]
						}
						searchKeywords = keywords.filter((keyword): keyword is string => typeof keyword === 'string').join(' ')
					} else if (typeof label === 'string') {
						searchKeywords = label
					} else {
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
		[desugaredOptionPath, optionEntities, renderOption, getSearchKeywords],
	)

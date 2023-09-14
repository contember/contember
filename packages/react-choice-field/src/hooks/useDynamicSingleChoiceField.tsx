import {
	EntityAccessor,
	QueryLanguage,
	RelativeSingleEntity,
	SugaredRelativeSingleEntity,
	useAccessorUpdateSubscription,
	useEntity,
	useEnvironment,
} from '@contember/react-binding'
import { useCallback, useMemo } from 'react'
import { BaseDynamicChoiceField, BaseDynamicChoiceFieldOptions } from '../BaseDynamicChoiceField'
import { useSelectOptions } from './useSelectOptions'
import { useCurrentValues } from './useCurrentValues'
import { SingleChoiceFieldRendererProps } from '../Renderers'

export type DynamicSingleChoiceFieldProps =
	& SugaredRelativeSingleEntity
	& BaseDynamicChoiceField

export type SimpleDynamicSingleChoiceFieldProps =
	& SugaredRelativeSingleEntity
	& BaseDynamicChoiceFieldOptions
	& Pick<DynamicSingleChoiceFieldProps, 'transformOptions'>

export const useDynamicSingleChoiceField = (
	props: DynamicSingleChoiceFieldProps,
): SingleChoiceFieldRendererProps<EntityAccessor> => {
	const [currentValueEntity, currentValueParent, currentValueFieldName] = useCurrentAccessors(props)
	const currentlyChosenEntities = useMemo(
		() => currentValueEntity.existsOnServer || currentValueEntity.hasUnpersistedChanges ? [currentValueEntity] : [],
		[currentValueEntity],
	)

	const { options, onSearch, isLoading } = useSelectOptions(props, currentlyChosenEntities)

	const currentValues = useCurrentValues(props, currentlyChosenEntities)

	return {
		data: options,
		errors: currentValueEntity.errors?.errors,
		currentValue: currentValues.length ? currentValues[0] : null,
		onSelect: value => {
				currentValueParent.connectEntityAtField(currentValueFieldName, value)
		},
		onClear: () => {
			currentValueParent.disconnectEntityAtField(currentValueFieldName)
		},
		onSearch,
		isLoading,
	}
}

const useCurrentAccessors = (props: DynamicSingleChoiceFieldProps): [EntityAccessor, EntityAccessor, string] => {
	const environment = useEnvironment()

	const desugaredRelativePath = useMemo<RelativeSingleEntity>(() => {
		return QueryLanguage.desugarRelativeSingleEntity(props, environment)
	}, [environment, props])
	const hasOneRelationPath = desugaredRelativePath.hasOneRelationPath
	const parentEntity = useEntity()

	const lastHasOneRelation = hasOneRelationPath[hasOneRelationPath.length - 1]
	const currentValueFieldName = lastHasOneRelation.field

	const getCurrentValueParent = useCallback((): EntityAccessor => {
		return parentEntity.getRelativeSingleEntity({
			hasOneRelationPath: desugaredRelativePath.hasOneRelationPath.slice(0, -1),
		})
	}, [desugaredRelativePath.hasOneRelationPath, parentEntity])

	const currentValueParent = useAccessorUpdateSubscription(getCurrentValueParent)
	const currentValueEntity = useMemo(() => {
		return currentValueParent.getRelativeSingleEntity({ hasOneRelationPath: [lastHasOneRelation] })
	}, [currentValueParent, lastHasOneRelation])

	return [currentValueEntity, currentValueParent, currentValueFieldName]
}

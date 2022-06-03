import {
	EntityAccessor,
	QueryLanguage,
	RelativeSingleEntity,
	SugaredRelativeSingleEntity,
	useAccessorUpdateSubscription,
	useEntity,
	useEnvironment,
} from '@contember/binding'
import { useCallback, useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import type { ChoiceFieldData } from '../ChoiceFieldData'
import { useSelectOptions } from './useSelectOptions'
import { useAccessorErrors } from '../../../errors'
import { useOnAddNew } from './useOnAddNew'
import { useCurrentValues } from './useCurrentValues'

export type DynamicSingleChoiceFieldProps = SugaredRelativeSingleEntity & BaseDynamicChoiceField

export const useDynamicSingleChoiceField = (
	props: DynamicSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata<EntityAccessor> => {
	const [currentValueEntity, currentValueParent, currentValueFieldName] = useCurrentAccessors(props)
	const currentlyChosenEntities = useMemo(
		() => currentValueEntity.existsOnServer || currentValueEntity.hasUnpersistedChanges ? [currentValueEntity] : [],
		[currentValueEntity],
	)

	const { options, onSearch, isLoading } = useSelectOptions(props, currentlyChosenEntities)

	const currentValues = useCurrentValues(props, currentlyChosenEntities)
	const errors = useAccessorErrors(currentValueEntity)

	return {
		data: options,
		errors,
		currentValue: currentValues.length ? currentValues[0] : null,
		onSelect: value => {
				currentValueParent.connectEntityAtField(currentValueFieldName, value.actualValue)
		},
		onClear: () => {
			currentValueParent.disconnectEntityAtField(currentValueFieldName)
		},
		onAddNew: useOnAddNew({
			...props,
			connect: useCallback(entity => {
				currentValueParent.connectEntityAtField(currentValueFieldName, entity)
			}, [currentValueFieldName, currentValueParent]),
		}),
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

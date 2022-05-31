import {
	EntityListAccessor,
	QueryLanguage,
	RelativeEntityList,
	SugaredRelativeEntityList,
	useAccessorUpdateSubscription,
	useEntityKey,
	useEnvironment,
	useGetEntityByKey,
	useMutationState,
} from '@contember/binding'
import { useCallback, useMemo } from 'react'
import { BaseDynamicChoiceField, useCurrentValues } from './BaseDynamicChoiceField'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { useSelectOptions } from './useSelectOptions'
import { useAccessorErrors } from '../../errors'
import { useOnAddNew } from './useOnAddNew'

export type DynamicMultipleChoiceFieldProps = SugaredRelativeEntityList & BaseDynamicChoiceField

export const useDynamicMultipleChoiceField = (
	props: DynamicMultipleChoiceFieldProps,
): ChoiceFieldData.MultipleChoiceFieldMetadata => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const environment = useEnvironment()
	const isMutating = useMutationState()

	const desugaredRelativePath = useMemo<RelativeEntityList>(
		() => QueryLanguage.desugarRelativeEntityList(props, environment),
		[environment, props],
	)

	const getCurrentValueEntity = useCallback((): EntityListAccessor => {
		const parentEntity = getEntityByKey(entityKey)

		return parentEntity.getRelativeEntityList(desugaredRelativePath)
	}, [entityKey, desugaredRelativePath, getEntityByKey])

	const currentValueListAccessor = useAccessorUpdateSubscription(getCurrentValueEntity)
	const currentlyChosenEntities = Array.from(currentValueListAccessor)

	const [entities, options] = useSelectOptions(props, currentlyChosenEntities)

	const currentValues = useCurrentValues(currentlyChosenEntities, entities)

	const getCurrentValues = currentValueListAccessor.getAccessor

	const clear = useCallback(() => {
		getCurrentValues().batchUpdates(getListAccessor => {
			for (const child of getListAccessor()) {
				getListAccessor().disconnectEntity(child)
			}
		})
	}, [getCurrentValues])

	const onChange = useCallback(
		(optionKey: ChoiceFieldData.ValueRepresentation, isChosen: boolean) => {
			if (isChosen) {
				getCurrentValues().connectEntity(entities[optionKey])
			} else {
				getCurrentValues().disconnectEntity(entities[optionKey])
			}
		},
		[entities, getCurrentValues],
	)

	const errors = useAccessorErrors(currentValueListAccessor)

	return {
		isMutating,
		environment,
		currentValues,
		data: options,
		errors,
		clear,
		onChange,
		onAddNew: useOnAddNew({
			...props,
			connect: useCallback(entity => {
				getCurrentValues().connectEntity(entity)
			}, [getCurrentValues]),
		}),
	}
}

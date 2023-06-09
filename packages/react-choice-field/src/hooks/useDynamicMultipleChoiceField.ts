import { SugaredRelativeEntityList, useEntityList, useSortedEntities } from '@contember/react-binding'
import { useCallback } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { useSelectOptions } from './useSelectOptions'
import { DynamicMultipleChoiceWithConnectingEntityFieldProps } from './useDynamicMultipleChoiceWithConnectingEntityField'
import { useCurrentValues } from './useCurrentValues'
import { DynamicMultiChoiceFieldRendererProps } from '../Renderers'

export type DynamicMultipleChoiceFieldProps =
	& SugaredRelativeEntityList
	& BaseDynamicChoiceField
	& (
		| { }
		| DynamicMultipleChoiceWithConnectingEntityFieldProps
	)

export const useDynamicMultipleChoiceField = (
	props: DynamicMultipleChoiceFieldProps,
): DynamicMultiChoiceFieldRendererProps => {
	const currentValueListAccessor = useEntityList(props)
	const currentlyChosenEntities = useSortedEntities(currentValueListAccessor, props.sortableBy)

	const { options, onSearch, isLoading } = useSelectOptions(props, currentlyChosenEntities.entities)

	const currentValues = useCurrentValues(props, currentlyChosenEntities.entities)

	const getCurrentValues = currentValueListAccessor.getAccessor

	const clear = useCallback(() => {
		getCurrentValues().batchUpdates(getListAccessor => {
			for (const child of getListAccessor()) {
				getListAccessor().disconnectEntity(child)
			}
		})
	}, [getCurrentValues])

	return {
		currentValues,
		data: options,
		errors: currentValueListAccessor.errors?.errors,
		onClear: clear,
		onAdd: useCallback(value => {
			getCurrentValues().connectEntity(value)
		}, [getCurrentValues]),
		onRemove: useCallback(value => {
			getCurrentValues().disconnectEntity(value)
		}, [getCurrentValues]),
		onMove: props.sortableBy ? currentlyChosenEntities.moveEntity : undefined,
		onSearch,
		isLoading,
	}
}

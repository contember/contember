import {
	EntityAccessor, EntityId,
	SugaredFieldProps,
	SugaredRelativeSingleEntity,
	useDesugaredRelativeSingleEntity,
	useEntityList,
	useSortedEntities,
} from '@contember/binding'
import { useCallback, useMemo } from 'react'
import type { ChoiceFieldData } from '../ChoiceFieldData'
import { useSelectOptions } from './useSelectOptions'
import { useAccessorErrors } from '../../../errors'
import { useOnAddNew } from './useOnAddNew'
import { DynamicMultipleChoiceFieldProps } from './useDynamicMultipleChoiceField'
import { useCurrentValues } from './useCurrentValues'

export interface DynamicMultipleChoiceWithConnectingEntityFieldProps {
	connectingEntityField: string | SugaredRelativeSingleEntity
	sortableBy?: SugaredFieldProps['field']
}

export const useDynamicMultipleChoiceWithConnectingEntityField = (
	props: DynamicMultipleChoiceFieldProps & DynamicMultipleChoiceWithConnectingEntityFieldProps,
): ChoiceFieldData.MultipleChoiceFieldMetadata<EntityAccessor> => {
	const connectingEntitiesListAccessor = useEntityList(props)
	const sortedConnectingEntities = useSortedEntities(connectingEntitiesListAccessor, props.sortableBy)
	const optionTargetField = useDesugaredRelativeSingleEntity(props.connectingEntityField)

	const [currentlyChosenOptions, optionIdToConnectingEntityMap] = useMemo(() => {
		const currentlyChosenOptions = []
		const optionIdToConnectingEntityMap = new Map<EntityId, EntityAccessor>()
		for (const connectingEntity of sortedConnectingEntities.entities) {
			const optionEntity = connectingEntity.getRelativeSingleEntity(optionTargetField)
			currentlyChosenOptions.push(optionEntity)
			optionIdToConnectingEntityMap.set(optionEntity.id, connectingEntity)
		}
		return [currentlyChosenOptions, optionIdToConnectingEntityMap]
	}, [optionTargetField, sortedConnectingEntities.entities])


	const options = useSelectOptions(props, currentlyChosenOptions)

	const currentValues = useCurrentValues(props, currentlyChosenOptions)

	const getConnectingEntityValues = connectingEntitiesListAccessor.getAccessor

	const clear = useCallback(() => {
		getConnectingEntityValues().batchUpdates(getListAccessor => {
			for (const child of getListAccessor()) {
				child.deleteEntity()
			}
		})
	}, [getConnectingEntityValues])

	const onAdd = useCallback((option: EntityAccessor) => {
		sortedConnectingEntities.appendNew(accessor => {
			const entity = accessor()
			const hasOne = optionTargetField.hasOneRelationPath
			const parentEntity = entity.getRelativeSingleEntity({ hasOneRelationPath: hasOne.slice(0, -1) })
			parentEntity.connectEntityAtField(hasOne[hasOne.length - 1].field, option)
		})
	}, [optionTargetField.hasOneRelationPath, sortedConnectingEntities])

	const errors = useAccessorErrors(connectingEntitiesListAccessor)

	return {
		currentValues,
		data: options,
		errors,
		onClear: clear,
		onAdd: useCallback(value => {
			onAdd(value.actualValue)
		}, [onAdd]),
		onRemove: useCallback(value => {
			optionIdToConnectingEntityMap.get(value.actualValue.id)?.deleteEntity()
		}, [optionIdToConnectingEntityMap]),
		onAddNew: useOnAddNew({
			...props,
			connect: onAdd,
		}),
		onMove: sortedConnectingEntities.moveEntity,
	}
}

import {
	EntityAccessor,
	EntityId,
	SugaredRelativeSingleEntity,
	useDesugaredRelativeSingleEntity,
	useEntityList,
	useSortedEntities,
} from '@contember/react-binding'
import { useCallback, useMemo } from 'react'
import { useSelectOptions } from './useSelectOptions'
import { DynamicMultipleChoiceFieldProps } from './useDynamicMultipleChoiceField'
import { useCurrentValues } from './useCurrentValues'
import { DynamicMultiChoiceFieldRendererProps } from '../Renderers'

export interface DynamicMultipleChoiceWithConnectingEntityFieldProps {
	connectingEntityField: string | SugaredRelativeSingleEntity
}

export const useDynamicMultipleChoiceWithConnectingEntityField = (
	props: DynamicMultipleChoiceFieldProps & DynamicMultipleChoiceWithConnectingEntityFieldProps,
): DynamicMultiChoiceFieldRendererProps => {
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


	const { options, onSearch, isLoading } = useSelectOptions(props, currentlyChosenOptions)

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

	return {
		currentValues,
		data: options,
		errors: connectingEntitiesListAccessor.errors?.errors,
		onClear: clear,
		onAdd: useCallback(value => {
			onAdd(value)
		}, [onAdd]),
		onRemove: useCallback(value => {
			optionIdToConnectingEntityMap.get(value.id)?.deleteEntity()
		}, [optionIdToConnectingEntityMap]),
		onMove: props.sortableBy ? sortedConnectingEntities.moveEntity : undefined,
		onSearch,
		isLoading,
	}
}

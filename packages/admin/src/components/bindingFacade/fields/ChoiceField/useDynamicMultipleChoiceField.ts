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
import * as React from 'react'
import {
	BaseDynamicChoiceField,
	useCurrentValues,
	useDesugaredOptionPath,
	useNormalizedOptions,
	useOptionEntities,
	useTopLevelOptionAccessors,
} from './BaseDynamicChoiceField'
import { ChoiceFieldData } from './ChoiceFieldData'

export type DynamicMultipleChoiceFieldProps = SugaredRelativeEntityList & BaseDynamicChoiceField

export const useDynamicMultipleChoiceField = (
	props: DynamicMultipleChoiceFieldProps,
): ChoiceFieldData.MultipleChoiceFieldMetadata => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const environment = useEnvironment()
	const isMutating = useMutationState()

	const desugaredRelativePath = React.useMemo<RelativeEntityList>(
		() => QueryLanguage.desugarRelativeEntityList(props, environment),
		[environment, props],
	)

	const getCurrentValueEntity = React.useCallback((): EntityListAccessor => {
		const parentEntity = getEntityByKey(entityKey)

		return parentEntity.getRelativeEntityList(desugaredRelativePath as RelativeEntityList)
	}, [entityKey, desugaredRelativePath, getEntityByKey])

	const currentValueEntity = useAccessorUpdateSubscription(getCurrentValueEntity)
	const currentlyChosenEntities = Array.from(currentValueEntity)

	//
	const desugaredOptionPath = useDesugaredOptionPath(props)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const optionEntities = useOptionEntities(topLevelOptionAccessors, desugaredOptionPath)
	const currentValues = useCurrentValues(currentlyChosenEntities, topLevelOptionAccessors)

	const normalizedOptions = useNormalizedOptions(
		optionEntities,
		desugaredOptionPath,
		'renderOption' in props && props.renderOption ? props.renderOption : undefined,
		'getSearchKeywords' in props && props.getSearchKeywords ? props.getSearchKeywords : undefined,
	)

	const { batchUpdates, connectEntity, disconnectEntity } = currentValueEntity

	const clear = React.useCallback(() => {
		batchUpdates(getListAccessor => {
			for (const child of getListAccessor()) {
				getListAccessor().disconnectEntity?.(child)
			}
		})
	}, [batchUpdates])

	const onChange = React.useCallback(
		(optionKey: ChoiceFieldData.ValueRepresentation, isChosen: boolean) => {
			if (isChosen) {
				connectEntity?.(optionEntities[optionKey])
			} else {
				disconnectEntity?.(optionEntities[optionKey])
			}
		},
		[optionEntities, connectEntity, disconnectEntity],
	)

	return {
		isMutating,
		environment,
		currentValues,
		data: normalizedOptions,
		errors: currentValueEntity.errors,
		clear,
		onChange,
	}
}

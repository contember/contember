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

	const desugaredRelativePath = useMemo<RelativeEntityList>(
		() => QueryLanguage.desugarRelativeEntityList(props, environment),
		[environment, props],
	)

	const getCurrentValueEntity = useCallback((): EntityListAccessor => {
		const parentEntity = getEntityByKey(entityKey)

		return parentEntity.getRelativeEntityList(desugaredRelativePath as RelativeEntityList)
	}, [entityKey, desugaredRelativePath, getEntityByKey])

	const currentValueListAccessor = useAccessorUpdateSubscription(getCurrentValueEntity)
	const currentlyChosenEntities = Array.from(currentValueListAccessor)

	//
	const desugaredOptionPath = useDesugaredOptionPath(props)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const optionEntities = useOptionEntities(topLevelOptionAccessors, desugaredOptionPath)
	const currentValues = useCurrentValues(currentlyChosenEntities, topLevelOptionAccessors)

	const normalizedOptions = useNormalizedOptions(
		optionEntities,
		desugaredOptionPath,
		'renderOption' in props && props.renderOption ? props.renderOption : undefined,
		props.searchByFields,
	)

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
				getCurrentValues().connectEntity(optionEntities[optionKey])
			} else {
				getCurrentValues().disconnectEntity(optionEntities[optionKey])
			}
		},
		[optionEntities, getCurrentValues],
	)

	return {
		isMutating,
		environment,
		currentValues,
		data: normalizedOptions,
		errors: currentValueListAccessor.errors,
		clear,
		onChange,
	}
}

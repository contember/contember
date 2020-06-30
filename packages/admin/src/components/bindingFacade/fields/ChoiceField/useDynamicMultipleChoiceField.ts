import {
	EntityListAccessor,
	QueryLanguage,
	RelativeEntityList,
	SugaredRelativeEntityList,
	useAccessorUpdateSubscription__UNSTABLE,
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

	const currentValueEntity = useAccessorUpdateSubscription__UNSTABLE(getCurrentValueEntity)
	const currentlyChosenEntities = Array.from(currentValueEntity)

	//
	const desugaredOptionPath = useDesugaredOptionPath(props)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const optionEntities = useOptionEntities(topLevelOptionAccessors, desugaredOptionPath)
	const currentValues = useCurrentValues(currentlyChosenEntities, topLevelOptionAccessors)

	const normalizedOptions = useNormalizedOptions(
		optionEntities,
		desugaredOptionPath,
		'renderOptionText' in props && props.renderOptionText ? props.renderOptionText : undefined,
	)

	return {
		isMutating,
		environment,
		currentValues,
		data: normalizedOptions,
		errors: currentValueEntity.errors,
		onChange: (optionKey: ChoiceFieldData.ValueRepresentation, isChosen: boolean) => {
			if (currentValueEntity instanceof EntityListAccessor) {
				if (isChosen) {
					currentValueEntity.connectEntity?.(optionEntities[optionKey])
				} else {
					currentValueEntity.disconnectEntity?.(optionEntities[optionKey])
				}
			}
		},
	}
}

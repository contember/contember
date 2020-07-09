import {
	EntityAccessor,
	ExpectedEntityCount,
	PlaceholderGenerator,
	QueryLanguage,
	RelativeSingleEntity,
	SugaredRelativeSingleEntity,
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

export type DynamicSingleChoiceFieldProps = SugaredRelativeSingleEntity & BaseDynamicChoiceField

export const useDynamicSingleChoiceField = (
	props: DynamicSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const environment = useEnvironment()
	const isMutating = useMutationState()

	const desugaredRelativePath = React.useMemo<RelativeSingleEntity>(() => {
		return QueryLanguage.desugarRelativeSingleEntity(props, environment)
	}, [environment, props])

	const lastHasOneRelation =
		desugaredRelativePath.hasOneRelationPath[desugaredRelativePath.hasOneRelationPath.length - 1]
	const currentValueFieldPlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder(lastHasOneRelation)

	const getCurrentValueParent = React.useCallback((): EntityAccessor => {
		const parentEntity = getEntityByKey(entityKey)
		return desugaredRelativePath.hasOneRelationPath.length > 1
			? parentEntity.getRelativeSingleEntity({
					hasOneRelationPath: desugaredRelativePath.hasOneRelationPath.slice(0, -1),
			  })
			: parentEntity
	}, [entityKey, desugaredRelativePath, getEntityByKey])
	const currentValueParent = useAccessorUpdateSubscription(getCurrentValueParent)
	const currentValueEntity = currentValueParent.getRelativeSingleEntity({
		hasOneRelationPath: [lastHasOneRelation],
	})
	const currentlyChosenEntities = [currentValueEntity]

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
		data: normalizedOptions,
		errors: currentValueEntity.errors,
		isMutating,
		environment,
		currentValue: currentValues.length ? currentValues[0] : -1,
		onChange: (newValue: ChoiceFieldData.ValueRepresentation) => {
			const entity = currentlyChosenEntities[0]
			if (entity === undefined || !(currentValueEntity instanceof EntityAccessor)) {
				return
			}

			if (newValue === -1) {
				currentValueParent.disconnectEntityAtField?.(currentValueFieldPlaceholder)
			} else {
				currentValueParent.connectEntityAtField?.(currentValueFieldPlaceholder, topLevelOptionAccessors[newValue])
			}
		},
	}
}

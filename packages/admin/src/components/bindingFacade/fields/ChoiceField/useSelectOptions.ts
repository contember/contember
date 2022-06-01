import {
	BaseDynamicChoiceField,
	useDesugaredOptionPath,
	useMergeEntities,
	useNormalizedOptions,
	useOptionEntities,
	useTopLevelOptionAccessors,
} from './BaseDynamicChoiceField'
import { EntityAccessor } from '@contember/binding'
import { ChoiceFieldData } from './ChoiceFieldData'

export const useSelectOptions = (
	optionProps: BaseDynamicChoiceField,
	additionalAccessors?: EntityAccessor[],
): [EntityAccessor[], ChoiceFieldData.Data] => {
	const desugaredOptionPath = useDesugaredOptionPath(optionProps)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const mergedEntities = useMergeEntities(additionalAccessors ?? [], topLevelOptionAccessors)
	const optionEntities = useOptionEntities(mergedEntities, desugaredOptionPath)

	const normalizedOptions = useNormalizedOptions(
		optionEntities,
		desugaredOptionPath,
		'renderOption' in optionProps && optionProps.renderOption ? optionProps.renderOption : undefined,
		'optionLabel' in optionProps && optionProps.optionLabel ? optionProps.optionLabel : undefined,
		optionProps.searchByFields,
	)
	return [mergedEntities, normalizedOptions]
}

import {
	BaseDynamicChoiceField,
	useDesugaredOptionPath,
	useMergeEntities,
	useNormalizedOptions,
	useTopLevelOptionAccessors,
} from './BaseDynamicChoiceField'
import { EntityAccessor } from '@contember/binding'
import { ChoiceFieldData } from './ChoiceFieldData'

export const useSelectOptions = (
	optionProps: BaseDynamicChoiceField,
	additionalAccessors?: EntityAccessor[],
): ChoiceFieldData.Data<EntityAccessor> => {
	const desugaredOptionPath = useDesugaredOptionPath(optionProps)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const mergedEntities = useMergeEntities(additionalAccessors ?? [], topLevelOptionAccessors)

	return useNormalizedOptions(
		mergedEntities,
		desugaredOptionPath,
		optionProps,
	)
}

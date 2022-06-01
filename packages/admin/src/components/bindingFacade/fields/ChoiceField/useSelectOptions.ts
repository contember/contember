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
): [EntityAccessor[], ChoiceFieldData.Data] => {
	const desugaredOptionPath = useDesugaredOptionPath(optionProps)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const mergedEntities = useMergeEntities(additionalAccessors ?? [], topLevelOptionAccessors)

	const normalizedOptions = useNormalizedOptions(
		mergedEntities,
		desugaredOptionPath,
		optionProps,
	)
	return [mergedEntities, normalizedOptions]
}

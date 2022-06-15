import { useDesugaredOptionPath } from './useDesugaredOptionPath'
import { useNormalizedOptions } from './useNormalizedOptions'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { EntityAccessor } from '@contember/binding'

export const useCurrentValues = (
	optionProps: BaseDynamicChoiceField,
	currentlyChosenEntities: EntityAccessor[],
) => {
	const desugaredOptionPath = useDesugaredOptionPath(optionProps, undefined)
	return useNormalizedOptions(
		currentlyChosenEntities,
		desugaredOptionPath,
		optionProps,
	)
}

import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { EntityAccessor } from '@contember/binding'
import { ChoiceFieldData } from '../ChoiceFieldData'
import { useMemo } from 'react'
import { useDesugaredOptionPath } from './useDesugaredOptionPath'
import { useTopLevelOptionAccessors } from './useTopLevelOptionAccessor'
import { useNormalizedOptions } from './useNormalizedOptions'


export const useSelectOptions = (
	optionProps: BaseDynamicChoiceField,
	additionalAccessors: EntityAccessor[] = [],
): ChoiceFieldData.Data<EntityAccessor> => {
	const desugaredOptionPath = useDesugaredOptionPath(optionProps)
	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath)
	const mergedEntities = useMemo(() => {
		const ids = new Set(topLevelOptionAccessors.map(it => it.id))
		return [
			...topLevelOptionAccessors,
			...additionalAccessors.filter(it => !ids.has(it.id)),
		]
	}, [additionalAccessors, topLevelOptionAccessors])

	return useNormalizedOptions(
		mergedEntities,
		desugaredOptionPath,
		optionProps,
	)
}

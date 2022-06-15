import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { EntityId, Filter, TreeRootId, useEnvironment, useExtendTree } from '@contember/binding'
import { useDesugaredOptionPath } from './useDesugaredOptionPath'
import { useEffect, useMemo, useState } from 'react'
import { useTopLevelOptionAccessors } from './useTopLevelOptionAccessor'
import { renderDynamicChoiceFieldStatic } from '../renderDynamicChoiceFieldStatic'

export const useCurrentlyChosenEntities = (
	optionProps: BaseDynamicChoiceField,
	ids: EntityId[],
) => {
	const filter = useMemo(() => ({
		id: { in: ids },
	}), [ids])
	const [renderedState, setRenderedState] = useState<{ treeRootId: TreeRootId | undefined, filter: Filter | undefined }>({
		treeRootId: undefined,
		filter: { id: { in: [] } },
	})
	const desugaredOptionPath = useDesugaredOptionPath(optionProps, renderedState.filter)
	const extendTree = useExtendTree()
	const environment = useEnvironment()
	useEffect(() => {
		if (renderedState.filter === filter || !optionProps.lazy) {
			return
		}
		(async () => {
			const { subTree } = renderDynamicChoiceFieldStatic({
				...optionProps,
				createNewForm: undefined,
			}, environment, filter)
			const treeRootId = await extendTree(subTree)
			if (treeRootId) {
				setRenderedState({
					treeRootId,
					filter,
				})
			}
		})()
	}, [environment, extendTree, filter, optionProps, renderedState.filter])

	return useTopLevelOptionAccessors(desugaredOptionPath, renderedState.treeRootId)
}

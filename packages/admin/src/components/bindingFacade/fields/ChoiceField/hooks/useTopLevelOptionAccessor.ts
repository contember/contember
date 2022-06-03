import { useCallback, useMemo } from 'react'
import {
	SugaredQualifiedEntityList,
	TreeRootId,
	useAccessorUpdateSubscription,
	useGetEntityListSubTree,
} from '@contember/binding'
import { DesugaredOptionPath } from './useDesugaredOptionPath'

export const useTopLevelOptionAccessors = (desugaredOptionPath: DesugaredOptionPath, treeRootId: TreeRootId | undefined) => {
	const getSubTree = useGetEntityListSubTree()
	const entityList = useMemo<SugaredQualifiedEntityList>(
		() => ({ entities: desugaredOptionPath, ...desugaredOptionPath }),
		[desugaredOptionPath],
	)
	const getSubTreeData = useCallback(() => getSubTree(entityList, treeRootId), [entityList, getSubTree, treeRootId])
	const subTreeData = useAccessorUpdateSubscription(getSubTreeData)
	return useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

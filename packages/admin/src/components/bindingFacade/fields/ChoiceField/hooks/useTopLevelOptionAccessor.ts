import { useMemo } from 'react'
import { SugaredQualifiedEntityList, TreeRootId, useEntityListSubTree } from '@contember/binding'
import { DesugaredOptionPath } from './useDesugaredOptionPath'

export const useTopLevelOptionAccessors = (desugaredOptionPath: DesugaredOptionPath, treeRootId: TreeRootId | undefined) => {
	const entityList = useMemo<SugaredQualifiedEntityList>(
		() => ({ entities: desugaredOptionPath, ...desugaredOptionPath }),
		[desugaredOptionPath],
	)
	const subTreeData = useEntityListSubTree(entityList, treeRootId)
	return useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

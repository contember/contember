import { useCallback, useMemo } from 'react'
import {
	QualifiedEntityList,
	QualifiedFieldList,
	SugaredQualifiedEntityList, useAccessorUpdateSubscription,
	useGetEntityListSubTree,
} from '@contember/binding'

export const useTopLevelOptionAccessors = (desugaredOptionPath: QualifiedFieldList | QualifiedEntityList) => {
	const getSubTree = useGetEntityListSubTree()
	const entityList = useMemo<SugaredQualifiedEntityList>(
		() => ({ entities: desugaredOptionPath, ...desugaredOptionPath }),
		[desugaredOptionPath],
	)
	const getSubTreeData = useCallback(() => getSubTree(entityList), [entityList, getSubTree])
	const subTreeData = useAccessorUpdateSubscription(getSubTreeData)
	return useMemo(() => Array.from(subTreeData), [subTreeData]) // Preserve ref equality if possible.
}

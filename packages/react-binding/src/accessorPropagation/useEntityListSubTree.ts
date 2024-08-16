import { useCallback } from 'react'
import type { EntityListAccessor } from '@contember/binding'
import type { Alias, SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useEntityListSubTreeParameters } from './useEntityListSubTreeParameters'
import { useGetEntityListSubTree } from './useGetEntityListSubTree'
import { TreeRootId } from '@contember/binding'

export const useEntityListSubTree = (
	qualifiedEntityList: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	...treeId: [TreeRootId | undefined] | []
): EntityListAccessor => {
	const getSubTree = useGetEntityListSubTree()
	const parameters = useEntityListSubTreeParameters(qualifiedEntityList)
	const hasTreeId = treeId.length > 0
	const treeIdVal = treeId[0]
	const getAccessor = useCallback(
		() => getSubTree(parameters, ...(hasTreeId ? [treeIdVal] : [])),
		[getSubTree, hasTreeId, parameters, treeIdVal],
	)

	// if (typeof parameters !== 'string' && parameters.value.hasOneRelationPath.length) {
	// 	throw new BindingError(`useEntityListSubTree: cannot use hasOneRelationPath!`)
	// }

	return useAccessorUpdateSubscription(getAccessor)
}

import { useCallback } from 'react'
import type { EntityListAccessor } from '@contember/binding'
import type {
	Alias,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
	TreeRootId,
} from '@contember/binding'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'
import { useTreeRootId } from './useTreeRootId'

export const useGetEntityListSubTree = (): ((
	parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	...treeId: [TreeRootId | undefined] | []
) => EntityListAccessor) => {
	const environment = useEnvironment()
	const getEntityListSubTree = useBindingOperations().getEntityListSubTree
	const treeRootId = useTreeRootId()

	return useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
			...treeId: [TreeRootId | undefined] | []
		) => getEntityListSubTree(parametersOrAlias, treeId.length === 0 ? treeRootId : treeId[0], environment),
		[environment, getEntityListSubTree, treeRootId],
	)
}

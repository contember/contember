import { useCallback } from 'react'
import type { EntityAccessor } from '@contember/binding'
import type {
	Alias,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '@contember/binding'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'
import { useTreeRootId } from './useTreeRootId'

export const useGetEntitySubTree = (): ((
	parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	...treeId: [TreeRootId | undefined] | []
) => EntityAccessor) => {
	const environment = useEnvironment()
	const getEntitySubTree = useBindingOperations().getEntitySubTree
	const treeRootId = useTreeRootId()

	return useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
			...treeId: [TreeRootId | undefined] | []
		) => getEntitySubTree(parametersOrAlias, treeId.length === 0 ? treeRootId : treeId[0], environment),
		[environment, getEntitySubTree, treeRootId],
	)
}

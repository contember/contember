import * as React from 'react'
import {
	Alias,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
	TreeRootId,
} from '../treeParameters'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'
import { useTreeRootId } from './useTreeRootId'

export const useGetEntityListSubTree = () => {
	const environment = useEnvironment()
	const getEntityListSubTree = useBindingOperations().getEntityListSubTree
	const treeRootId = useTreeRootId()

	return React.useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
			...treeId: [TreeRootId | undefined] | []
		) => getEntityListSubTree(parametersOrAlias, treeId.length === 0 ? treeRootId : treeId[0], environment),
		[environment, getEntityListSubTree, treeRootId],
	)
}

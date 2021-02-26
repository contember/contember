import * as React from 'react'
import {
	Alias,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
	TreeRootId,
} from '../treeParameters'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'
import { TreeRootIdContext } from './TreeRootIdContext'

export const useGetEntityListSubTree = () => {
	const environment = useEnvironment()
	const getEntityListSubTree = useBindingOperations().getEntityListSubTree
	const treeRootId = React.useContext(TreeRootIdContext)

	return React.useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
			...treeId: [TreeRootId | undefined] | []
		) => getEntityListSubTree(parametersOrAlias, treeId.length === 1 ? treeId[0] : treeRootId, environment),
		[treeRootId, environment, getEntityListSubTree],
	)
}

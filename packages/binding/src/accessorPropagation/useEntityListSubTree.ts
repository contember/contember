import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedEntityList,
	BoxedUnconstrainedQualifiedEntityList,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
} from '../treeParameters'
import { useAccessorUpdateSubscription__UNSTABLE } from './useAccessorUpdateSubscription__UNSTABLE'
import { useEnvironment } from './useEnvironment'
import { useGetSubTree } from './useGetSubTree'

export type UseEntityListSubTreeProps =
	| ({
			isCreating?: false
	  } & SugaredQualifiedEntityList)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedEntityList)

export const useEntityListSubTree = (qualifiedEntityList: UseEntityListSubTreeProps) => {
	const getSubTree = useGetSubTree()
	const environment = useEnvironment()

	// TODO this super bad. It's too sensitive to unwanted updates due to qualifiedEntityList changes.
	const parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList = React.useMemo(() => {
		if ('isCreating' in qualifiedEntityList && qualifiedEntityList.isCreating) {
			return new BoxedUnconstrainedQualifiedEntityList(
				QueryLanguage.desugarUnconstrainedQualifiedEntityList(qualifiedEntityList, environment),
			)
		}
		return new BoxedQualifiedEntityList(QueryLanguage.desugarQualifiedEntityList(qualifiedEntityList, environment))
	}, [environment, qualifiedEntityList])
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])

	return useAccessorUpdateSubscription__UNSTABLE(getAccessor)
}

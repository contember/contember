import { useConstantValueInvariant } from '@contember/react-utils'
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

	useConstantValueInvariant(
		qualifiedEntityList.isCreating,
		`EntityListSubTree: cannot alternate the 'isCreating' value.`,
	)

	let parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList

	// We're not really breaking rules of hooks here since the error state is prevented by the invariant above.
	if ('isCreating' in qualifiedEntityList && qualifiedEntityList.isCreating) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(
			() =>
				new BoxedUnconstrainedQualifiedEntityList(
					QueryLanguage.desugarUnconstrainedQualifiedEntityList(
						{
							connectTo: qualifiedEntityList.connectTo,
							entities: qualifiedEntityList.entities,
						},
						environment,
					),
				),
			[qualifiedEntityList.entities, qualifiedEntityList.connectTo, environment],
		)
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(
			() =>
				new BoxedQualifiedEntityList(
					QueryLanguage.desugarQualifiedEntityList(
						{
							connectTo: qualifiedEntityList.connectTo,
							entities: qualifiedEntityList.entities,
							orderBy: qualifiedEntityList.orderBy,
							offset: qualifiedEntityList.offset,
							limit: qualifiedEntityList.limit,
						},
						environment,
					),
				),
			[
				qualifiedEntityList.entities,
				qualifiedEntityList.connectTo,
				qualifiedEntityList.orderBy,
				qualifiedEntityList.offset,
				qualifiedEntityList.limit,
				environment,
			],
		)
	}
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])

	return useAccessorUpdateSubscription__UNSTABLE(getAccessor)
}

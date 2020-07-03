import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { BindingError } from '../BindingError'
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
							forceCreation: qualifiedEntityList.forceCreation,
							isNonbearing: qualifiedEntityList.isNonbearing,
							setOnCreate: qualifiedEntityList.setOnCreate,
							entities: qualifiedEntityList.entities,
						},
						environment,
					),
				),
			[
				qualifiedEntityList.entities,
				qualifiedEntityList.setOnCreate,
				qualifiedEntityList.forceCreation,
				qualifiedEntityList.isNonbearing,
				environment,
			],
		)
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(
			() =>
				new BoxedQualifiedEntityList(
					QueryLanguage.desugarQualifiedEntityList(
						{
							forceCreation: qualifiedEntityList.forceCreation,
							isNonbearing: qualifiedEntityList.isNonbearing,
							initialEntityCount: qualifiedEntityList.initialEntityCount,
							setOnCreate: qualifiedEntityList.setOnCreate,
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
				qualifiedEntityList.setOnCreate,
				qualifiedEntityList.orderBy,
				qualifiedEntityList.offset,
				qualifiedEntityList.limit,
				qualifiedEntityList.forceCreation,
				qualifiedEntityList.isNonbearing,
				qualifiedEntityList.initialEntityCount,
				environment,
			],
		)
	}
	if (parameters.value.hasOneRelationPath.length) {
		throw new BindingError(`EntityListSubTree: using hasOneRelationPath for lists is currently not supported.`)
	}
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])

	return useAccessorUpdateSubscription__UNSTABLE(getAccessor)
}

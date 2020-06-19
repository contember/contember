import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedSingleEntity,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { useAccessorUpdateSubscription__UNSTABLE } from './useAccessorUpdateSubscription__UNSTABLE'
import { useEnvironment } from './useEnvironment'
import { useGetSubTree } from './useGetSubTree'

export type UseSingleEntitySubTreeProps =
	| ({
			isCreating?: false
	  } & SugaredQualifiedSingleEntity)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedSingleEntity)

export const useSingleEntitySubTree = (qualifiedSingleEntity: UseSingleEntitySubTreeProps) => {
	const getSubTree = useGetSubTree()
	const environment = useEnvironment()

	useConstantValueInvariant(
		qualifiedSingleEntity.isCreating,
		`EntityListSubTree: cannot alternate the 'isCreating' value.`,
	)

	let parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity

	// We're not really breaking rules of hooks here since the error state is prevented by the invariant above.
	if ('isCreating' in qualifiedSingleEntity && qualifiedSingleEntity.isCreating) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(
			() =>
				new BoxedUnconstrainedQualifiedSingleEntity(
					QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(
						{
							entity: qualifiedSingleEntity.entity,
							connections: qualifiedSingleEntity.connections,
						},
						environment,
					),
				),
			[qualifiedSingleEntity.entity, qualifiedSingleEntity.connections, environment],
		)
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(
			() =>
				new BoxedQualifiedSingleEntity(
					QueryLanguage.desugarQualifiedSingleEntity(
						{
							entity: qualifiedSingleEntity.entity,
						},
						environment,
					),
				),
			[qualifiedSingleEntity.entity, environment],
		)
	}

	const getAccessor = React.useCallback(() => {
		const subTree = getSubTree(parameters)
		if (parameters.value.hasOneRelationPath.length) {
			return subTree.getRelativeSingleEntity({
				hasOneRelationPath: parameters.value.hasOneRelationPath,
			})
		}
		return subTree
	}, [getSubTree, parameters])

	return useAccessorUpdateSubscription__UNSTABLE(getAccessor)
}

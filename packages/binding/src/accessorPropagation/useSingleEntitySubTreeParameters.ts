import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedSingleEntity,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export type QualifiedSingleEntityProps = {
	isCreating?: false
} & SugaredQualifiedSingleEntity

export type UnconstrainedQualifiedSingleEntityProps = {
	isCreating: true
} & SugaredUnconstrainedQualifiedSingleEntity

export const useSingleEntitySubTreeParameters = (
	qualifiedSingleEntity: QualifiedSingleEntityProps | UnconstrainedQualifiedSingleEntityProps,
): BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity => {
	const environment = useEnvironment()

	useConstantValueInvariant(
		qualifiedSingleEntity.isCreating,
		`SingleEntitySubTree: cannot alternate the 'isCreating' value.`,
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
							forceCreation: qualifiedSingleEntity.forceCreation,
							isNonbearing: qualifiedSingleEntity.isNonbearing,
							entity: qualifiedSingleEntity.entity,
							setOnCreate: qualifiedSingleEntity.setOnCreate,
						},
						environment,
					),
				),
			[
				qualifiedSingleEntity.entity,
				qualifiedSingleEntity.setOnCreate,
				qualifiedSingleEntity.forceCreation,
				qualifiedSingleEntity.isNonbearing,
				environment,
			],
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

	return parameters
}

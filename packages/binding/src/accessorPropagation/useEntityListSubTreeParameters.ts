import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedEntityList,
	BoxedUnconstrainedQualifiedEntityList,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
} from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export type QualifiedEntityListProps = {
	isCreating?: false
} & SugaredQualifiedEntityList

export type UnconstrainedQualifiedEntityListProps = {
	isCreating: true
} & SugaredUnconstrainedQualifiedEntityList

export const useEntityListSubTreeParameters = (
	qualifiedEntityList: QualifiedEntityListProps | UnconstrainedQualifiedEntityListProps,
): BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList => {
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
							onInitialize: qualifiedEntityList.onInitialize,
						},
						environment,
					),
				),
			[
				qualifiedEntityList.entities,
				qualifiedEntityList.setOnCreate,
				qualifiedEntityList.forceCreation,
				qualifiedEntityList.isNonbearing,
				qualifiedEntityList.onInitialize,
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
							onInitialize: qualifiedEntityList.onInitialize,
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
				qualifiedEntityList.onInitialize,
				environment,
			],
		)
	}
	return parameters
}

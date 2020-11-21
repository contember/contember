import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	Alias,
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

export function useEntityListSubTreeParameters(alias: Alias): Alias
export function useEntityListSubTreeParameters(
	qualifiedEntityList: QualifiedEntityListProps | UnconstrainedQualifiedEntityListProps,
): BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList
export function useEntityListSubTreeParameters(
	qualifiedEntityListOrAlias: Alias | QualifiedEntityListProps | UnconstrainedQualifiedEntityListProps,
): Alias | BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList
export function useEntityListSubTreeParameters(
	qualifiedEntityList: Alias | QualifiedEntityListProps | UnconstrainedQualifiedEntityListProps,
): Alias | BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList {
	useConstantValueInvariant(typeof qualifiedEntityList)

	if (typeof qualifiedEntityList === 'string') {
		return qualifiedEntityList
	}

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const environment = useEnvironment()

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useConstantValueInvariant(
		qualifiedEntityList.isCreating,
		`EntityListSubTree: cannot alternate the 'isCreating' value.`,
	)

	let parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList

	// We're not really breaking rules of hooks here since the error state is prevented by the invariant above.
	if ('isCreating' in qualifiedEntityList && qualifiedEntityList.isCreating) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(() => {
			const entityList: Required<SugaredUnconstrainedQualifiedEntityList> = {
				entities: qualifiedEntityList.entities,
				forceCreation: qualifiedEntityList.forceCreation!,
				initialEntityCount: qualifiedEntityList.initialEntityCount!,
				isNonbearing: qualifiedEntityList.isNonbearing!,
				onBeforePersist: qualifiedEntityList.onBeforePersist!,
				onBeforeUpdate: qualifiedEntityList.onBeforeUpdate!,
				onChildInitialize: qualifiedEntityList.onChildInitialize!,
				onUpdate: qualifiedEntityList.onUpdate!,
				setOnCreate: qualifiedEntityList.setOnCreate!,
				expectedMutation: qualifiedEntityList.expectedMutation!,
				alias: qualifiedEntityList.alias!,
				onInitialize: qualifiedEntityList.onInitialize!,
				onPersistError: qualifiedEntityList.onPersistError!,
				onPersistSuccess: qualifiedEntityList.onPersistSuccess!,
			}
			return new BoxedUnconstrainedQualifiedEntityList(
				QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment),
			)
		}, [
			qualifiedEntityList.entities,
			qualifiedEntityList.forceCreation,
			qualifiedEntityList.initialEntityCount,
			qualifiedEntityList.isNonbearing,
			qualifiedEntityList.onBeforePersist,
			qualifiedEntityList.onBeforeUpdate,
			qualifiedEntityList.onChildInitialize,
			qualifiedEntityList.onUpdate,
			qualifiedEntityList.setOnCreate,
			qualifiedEntityList.expectedMutation,
			qualifiedEntityList.alias,
			qualifiedEntityList.onInitialize,
			qualifiedEntityList.onPersistError,
			qualifiedEntityList.onPersistSuccess,
			environment,
		])
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(() => {
			const entityList: Required<SugaredQualifiedEntityList> = {
				forceCreation: qualifiedEntityList.forceCreation!,
				isNonbearing: qualifiedEntityList.isNonbearing!,
				initialEntityCount: qualifiedEntityList.initialEntityCount!,
				setOnCreate: qualifiedEntityList.setOnCreate!,
				entities: qualifiedEntityList.entities,
				orderBy: qualifiedEntityList.orderBy!,
				offset: qualifiedEntityList.offset!,
				limit: qualifiedEntityList.limit!,
				alias: qualifiedEntityList.alias!,
				expectedMutation: qualifiedEntityList.expectedMutation!,
				onInitialize: qualifiedEntityList.onInitialize!,
				onUpdate: qualifiedEntityList.onUpdate!,
				onBeforeUpdate: qualifiedEntityList.onBeforeUpdate!,
				onBeforePersist: qualifiedEntityList.onBeforePersist!,
				onChildInitialize: qualifiedEntityList.onChildInitialize!,
				onPersistSuccess: qualifiedEntityList.onPersistSuccess!,
				onPersistError: qualifiedEntityList.onPersistError!,
			}
			return new BoxedQualifiedEntityList(QueryLanguage.desugarQualifiedEntityList(entityList, environment))
		}, [
			qualifiedEntityList.entities,
			qualifiedEntityList.setOnCreate,
			qualifiedEntityList.orderBy,
			qualifiedEntityList.offset,
			qualifiedEntityList.limit,
			qualifiedEntityList.forceCreation,
			qualifiedEntityList.isNonbearing,
			qualifiedEntityList.initialEntityCount,
			qualifiedEntityList.alias,
			qualifiedEntityList.expectedMutation,
			qualifiedEntityList.onInitialize,
			qualifiedEntityList.onUpdate,
			qualifiedEntityList.onBeforeUpdate,
			qualifiedEntityList.onBeforePersist,
			qualifiedEntityList.onChildInitialize,
			qualifiedEntityList.onPersistError,
			qualifiedEntityList.onPersistSuccess,
			environment,
		])
	}
	return parameters
}

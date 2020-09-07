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
		parameters = React.useMemo(() => {
			const singleEntity: Required<SugaredUnconstrainedQualifiedSingleEntity> = {
				forceCreation: qualifiedSingleEntity.forceCreation!,
				isNonbearing: qualifiedSingleEntity.isNonbearing!,
				entity: qualifiedSingleEntity.entity,
				setOnCreate: qualifiedSingleEntity.setOnCreate!,
				expectedMutation: qualifiedSingleEntity.expectedMutation!,
				unstable_onInitialize: qualifiedSingleEntity.unstable_onInitialize!,
				onConnectionUpdate: qualifiedSingleEntity.onConnectionUpdate!,
				onBeforeUpdate: qualifiedSingleEntity.onBeforeUpdate!,
				onUpdate: qualifiedSingleEntity.onUpdate!,
				onBeforePersist: qualifiedSingleEntity.onBeforePersist!,
			}
			return new BoxedUnconstrainedQualifiedSingleEntity(
				QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(singleEntity, environment),
			)
		}, [
			qualifiedSingleEntity.entity,
			qualifiedSingleEntity.setOnCreate,
			qualifiedSingleEntity.forceCreation,
			qualifiedSingleEntity.isNonbearing,
			qualifiedSingleEntity.expectedMutation,
			qualifiedSingleEntity.unstable_onInitialize,
			qualifiedSingleEntity.onConnectionUpdate,
			qualifiedSingleEntity.onBeforeUpdate,
			qualifiedSingleEntity.onUpdate,
			qualifiedSingleEntity.onBeforePersist,
			environment,
		])
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		parameters = React.useMemo(() => {
			const singleEntity: Required<SugaredQualifiedSingleEntity> = {
				forceCreation: qualifiedSingleEntity.forceCreation!,
				isNonbearing: qualifiedSingleEntity.isNonbearing!,
				entity: qualifiedSingleEntity.entity,
				setOnCreate: qualifiedSingleEntity.setOnCreate!,
				expectedMutation: qualifiedSingleEntity.expectedMutation!,
				unstable_onInitialize: qualifiedSingleEntity.unstable_onInitialize!,
				onConnectionUpdate: qualifiedSingleEntity.onConnectionUpdate!,
				onBeforeUpdate: qualifiedSingleEntity.onBeforeUpdate!,
				onUpdate: qualifiedSingleEntity.onUpdate!,
				onBeforePersist: qualifiedSingleEntity.onBeforePersist!,
			}
			return new BoxedQualifiedSingleEntity(QueryLanguage.desugarQualifiedSingleEntity(singleEntity, environment))
		}, [
			qualifiedSingleEntity.entity,
			qualifiedSingleEntity.setOnCreate,
			qualifiedSingleEntity.forceCreation,
			qualifiedSingleEntity.isNonbearing,
			qualifiedSingleEntity.expectedMutation,
			qualifiedSingleEntity.unstable_onInitialize,
			qualifiedSingleEntity.onConnectionUpdate,
			qualifiedSingleEntity.onBeforeUpdate,
			qualifiedSingleEntity.onUpdate,
			qualifiedSingleEntity.onBeforePersist,
			environment,
		])
	}

	return parameters
}

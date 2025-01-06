import { ErrorPersistResult, QueryLanguage, SuccessfulPersistResult, SugaredRelativeSingleEntity } from '@contember/binding'
import { useEffect, useMemo } from 'react'
import { useDecoratedPersist } from './useDecoratedPersist'
import { useEntity, useEnvironment } from '../../accessorPropagation'
import { Component, HasOne } from '../../coreComponents'

export type PersistOnHasOneChangeProps = {

	/**
	 * The relation field that should trigger persist when changed.
	 */
	field: SugaredRelativeSingleEntity['field']

	/**
	 * Callback that is called when persist is successful.
	 */
	onPersistSuccess?: (result: SuccessfulPersistResult) => void

	/**
	 * Callback that is called when an error occurs during persist.
	 */
	onPersistError?: (result: ErrorPersistResult) => void
}

/**
 * Triggers persist when the specified relation field changes.
 * This only works for has-one relation fields, for scalar fields, see {@link PersistOnFieldChange}.
 *
 * ## Props {@link PersistOnHasOneChangeProps}
 * - field, ?onPersistError, ?onPersistSuccess
 *
 * ## Example
 * ```tsx
 * <PersistOnHasOneChange field="author" />
 * ```
 */
export const PersistOnHasOneChange = Component<PersistOnHasOneChangeProps>(({ field, onPersistError, onPersistSuccess }) => {
	const doPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })
	const env = useEnvironment()
	const desugaredPath = useMemo(() => QueryLanguage.desugarRelativeSingleEntity({ field }, env), [field, env])
	const getEntity = useEntity(useMemo(() => ({
		field: desugaredPath.hasOneRelationPath.slice(0, -1),
	}), [desugaredPath])).getAccessor

	const lastField = desugaredPath.hasOneRelationPath[desugaredPath.hasOneRelationPath.length - 1].field

	useEffect(() => {
		const unregister = getEntity().addEventListener({ type: 'connectionUpdate', key: lastField }, async accessor => {
			if (!accessor.hasUnpersistedChanges) {
				return
			}
			await doPersist()
		})

		return unregister
	}, [getEntity, doPersist, lastField])

	return null
}, ({ field }) => <HasOne field={field}/>)

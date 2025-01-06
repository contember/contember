import { ErrorPersistResult, SuccessfulPersistResult, SugaredRelativeSingleField } from '@contember/binding'
import { useEffect } from 'react'
import { useField } from '../../accessorPropagation'
import { useDecoratedPersist } from './useDecoratedPersist'
import { Component, Field } from '../../coreComponents'

export type PersistOnFieldChangeProps = {

	/**
	 * The field that should trigger persist when changed.
	 */
	field: SugaredRelativeSingleField['field']

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
 * Triggers persist when the specified field changes.
 * This only works for scalar fields, for relations, see {@link PersistOnHasOneChange}.
 *
 * ## Props {@link PersistOnFieldChangeProps}
 * - field, ?onPersistError, ?onPersistSuccess
 *
 * ## Example
 * ```tsx
 * <PersistOnFieldChange field="name" />
 * ```
 */
export const PersistOnFieldChange = Component(({ field, onPersistError, onPersistSuccess }: PersistOnFieldChangeProps) => {
	const doPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })
	const getField = useField(field).getAccessor

	useEffect(() => {
		const unregister = getField().addEventListener({ type: 'update' }, async field => {
			if (!field.hasUnpersistedChanges) {
				return
			}
			await doPersist()
		})

		return unregister
	}, [getField, doPersist])

	return null
}, ({ field }) => <Field field={field} />)

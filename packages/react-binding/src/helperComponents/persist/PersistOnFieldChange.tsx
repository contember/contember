import { ErrorPersistResult, SuccessfulPersistResult, SugaredRelativeSingleField } from '@contember/binding'
import { useEffect } from 'react'
import { useField } from '../../accessorPropagation'
import { useDecoratedPersist } from './useDecoratedPersist'
import { Component, Field } from '../../coreComponents'

export type PersistOnFieldChangeProps = {
	field: SugaredRelativeSingleField['field']
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

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

import { ErrorPersistResult, QueryLanguage, SuccessfulPersistResult, SugaredRelativeSingleEntity } from '@contember/binding'
import { useEffect, useMemo } from 'react'
import { useDecoratedPersist } from './useDecoratedPersist'
import { useEntity, useEnvironment } from '../../accessorPropagation'
import { Component, HasOne } from '../../coreComponents'

export type PersistOnHasOneChangeProps = {
	field: SugaredRelativeSingleEntity['field']
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

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

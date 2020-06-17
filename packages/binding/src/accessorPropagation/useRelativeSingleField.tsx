import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { FieldAccessor } from '../accessors'
import { SugaredRelativeSingleField } from '../treeParameters'
import { FieldValue } from '../treeParameters/primitives'
import { useAccessorUpdateSubscription__UNSTABLE } from './useAccessorUpdateSubscription__UNSTABLE'
import { useDesugaredRelativeSingleField } from './useDesugaredRelativeSingleField'

function useRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
): FieldAccessor<Persisted, Produced>
function useRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined
function useRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined {
	const relativeSingleField = useDesugaredRelativeSingleField(sugaredRelativeSingleField)
	useConstantValueInvariant(
		!!relativeSingleField,
		'useRelativeSingleField: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const getField = React.useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeSingleField<Persisted, Produced>(relativeSingleField!)
	}, [entityKey, getEntityByKey, relativeSingleField])

	if (relativeSingleField) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useAccessorUpdateSubscription__UNSTABLE<Persisted, Produced>(getField)
	}
	return undefined
}

export { useRelativeSingleField }

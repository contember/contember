import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { FieldAccessor } from '../accessors'
import { useOnConnectionUpdate } from '../entityEvents'
import { SugaredRelativeSingleField } from '../treeParameters'
import { FieldValue } from '../treeParameters/primitives'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useDesugaredRelativeSingleField } from './useDesugaredRelativeSingleField'

function useField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
): FieldAccessor<Persisted, Produced>
function useField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined
function useField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined {
	const relativeSingleField = useDesugaredRelativeSingleField(sugaredRelativeSingleField)
	useConstantValueInvariant(
		!!relativeSingleField,
		'useField: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const getField = React.useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeSingleField<Persisted, Produced>(relativeSingleField!)
	}, [entityKey, getEntityByKey, relativeSingleField])

	if (relativeSingleField) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useConstantLengthInvariant(
			relativeSingleField.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const [field, forceUpdate] = useAccessorUpdateSubscription<Persisted, Produced>(getField, true)

		if (relativeSingleField.hasOneRelationPath.length) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useOnConnectionUpdate(relativeSingleField.hasOneRelationPath[0].field, forceUpdate)
		}

		return field
	}
	return undefined
}

export { useField }

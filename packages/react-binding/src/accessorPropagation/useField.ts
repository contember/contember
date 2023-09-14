import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import { useCallback } from 'react'
import { useEntityKey, useGetEntityByKey } from './index'
import type { FieldAccessor } from '@contember/binding'
import { useOnConnectionUpdate } from '../entityEvents'
import type { FieldValue, SugaredRelativeSingleField } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useDesugaredRelativeSingleField } from './useDesugaredRelativeSingleField'

function useField<Value extends FieldValue = FieldValue>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
): FieldAccessor<Value>
function useField<Value extends FieldValue = FieldValue>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Value> | undefined
function useField<Value extends FieldValue = FieldValue>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Value> | undefined {
	const relativeSingleField = useDesugaredRelativeSingleField(sugaredRelativeSingleField)
	useConstantValueInvariant(
		!!relativeSingleField,
		'useField: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const getField = useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeSingleField<Value>(relativeSingleField!)
	}, [entityKey, getEntityByKey, relativeSingleField])

	if (relativeSingleField) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useConstantLengthInvariant(
			relativeSingleField.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const [field, forceUpdate] = useAccessorUpdateSubscription<Value>(getField, true)

		if (relativeSingleField.hasOneRelationPath.length) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useOnConnectionUpdate(relativeSingleField.hasOneRelationPath[0].field, forceUpdate)
		}

		return field
	}
	return undefined
}

export { useField }

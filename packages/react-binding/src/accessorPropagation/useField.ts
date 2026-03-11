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
		return parent.getField<Value>(relativeSingleField!)
	}, [entityKey, getEntityByKey, relativeSingleField])

	if (relativeSingleField) {
		useConstantLengthInvariant(
			relativeSingleField.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		const [field, { update }] = useAccessorUpdateSubscription(getField)

		if (relativeSingleField.hasOneRelationPath.length) {
			useOnConnectionUpdate(relativeSingleField.hasOneRelationPath[0].field, update)
		}

		return field
	}
	return undefined
}

export { useField }

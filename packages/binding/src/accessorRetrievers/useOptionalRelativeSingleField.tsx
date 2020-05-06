import * as React from 'react'
import { FieldAccessor } from '../accessors'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { useEntityAccessor } from '../accessorPropagation'
import { useOptionalDesugaredRelativeSingleField } from './useOptionalDesugaredRelativeSingleField'

export const useOptionalRelativeSingleField = <
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined => {
	const entity = useEntityAccessor()
	const relativeSingleField = useOptionalDesugaredRelativeSingleField(sugaredRelativeSingleField)
	return React.useMemo(() => {
		return relativeSingleField ? entity.getRelativeSingleField<Persisted, Produced>(relativeSingleField) : undefined
	}, [entity, relativeSingleField])
}

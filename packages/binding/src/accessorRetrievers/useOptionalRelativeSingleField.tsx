import * as React from 'react'
import { FieldAccessor } from '../accessors'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { useEntityContext } from './useEntityContext'
import { useOptionalDesugaredRelativeSingleField } from './useOptionalDesugaredRelativeSingleField'

export const useOptionalRelativeSingleField = <
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): FieldAccessor<Persisted, Produced> | undefined => {
	const entity = useEntityContext()
	const relativeSingleField = useOptionalDesugaredRelativeSingleField(sugaredRelativeSingleField)
	return React.useMemo(() => {
		return relativeSingleField ? entity.getRelativeSingleField<Persisted, Produced>(relativeSingleField) : undefined
	}, [entity, relativeSingleField])
}

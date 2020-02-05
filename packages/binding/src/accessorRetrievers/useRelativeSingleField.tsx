import * as React from 'react'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { useDesugaredRelativeSingleField } from './useDesugaredRelativeSingleField'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleField = <
	Persisted extends FieldValue = FieldValue,
	Produced extends Persisted = Persisted
>(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
) => {
	const entity = useEntityContext()
	const relativeSingleField = useDesugaredRelativeSingleField(sugaredRelativeSingleField)
	return React.useMemo(() => entity.getRelativeSingleField<Persisted, Produced>(relativeSingleField), [
		entity,
		relativeSingleField,
	])
}

import * as React from 'react'
import { useEntityAccessor } from '../accessorPropagation'
import { FieldAccessor } from '../accessors'
import { SugaredRelativeSingleField } from '../treeParameters'
import { FieldValue } from '../treeParameters/primitives'
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
	const entity = useEntityAccessor()
	const relativeSingleField = useDesugaredRelativeSingleField(sugaredRelativeSingleField)
	return React.useMemo(() => {
		return relativeSingleField ? entity.getRelativeSingleField<Persisted, Produced>(relativeSingleField) : undefined
	}, [entity, relativeSingleField])
}

export { useRelativeSingleField }

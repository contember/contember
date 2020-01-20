import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { FieldAccessor } from '../accessors'
import { Scalar, SugaredRelativeSingleField } from '../treeParameters'
import { useEntityContext } from './useEntityContext'
import { useOptionalDesugaredRelativeSingleField } from './useOptionalDesugaredRelativeSingleField'

export const useOptionalRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
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

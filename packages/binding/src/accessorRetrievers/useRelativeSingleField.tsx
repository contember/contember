import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Scalar, SugaredRelativeSingleField } from '../treeParameters'
import { useDesugaredRelativeSingleField } from './useDesugaredRelativeSingleField'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
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

import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Scalar, SugaredRelativeSingleField } from '../treeParameters'
import { getRelativeSingleField } from './getRelativeSingleField'
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
	return React.useMemo(() => getRelativeSingleField<Persisted, Produced>(entity, relativeSingleField), [
		entity,
		relativeSingleField,
	])
}

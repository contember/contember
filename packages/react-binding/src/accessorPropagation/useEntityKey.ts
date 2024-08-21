import { useContext } from 'react'
import { BindingError, EntityAccessor } from '@contember/binding'
import { EntityKeyContext } from './EntityKeyContext'

export const useEntityKey = (): string | (() => EntityAccessor) => {
	const entityKey = useContext(EntityKeyContext)

	if (entityKey === undefined) {
		throw new BindingError(
			`Trying to use a data bound component outside a correct parent. You likely forgot to use <DataBindingProvider /> ` +
				`or a SubTree.`,
		)
	}
	return entityKey
}

import { EntityListAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import type { FieldName } from '../treeParameters'
import type { SortedEntities } from './useSortedEntities'

export const throwNoopError = (callbackName: keyof SortedEntities) => {
	throw new BindingError(
		`Cannot invoke '${callbackName}' in non-sortable mode. The 'sortByField' parameter of the 'useSortedEntities' ` +
			`hook is undefined.`,
	)
}

export const throwNonWritableError = (target: FieldName | EntityListAccessor) => {
	if (target instanceof EntityListAccessor) {
		throw new BindingError(`Trying to add a new entity to a list that is not writable.`)
	}
	throw new BindingError(`Trying to interactively sort by the '${target}' field but it is not writable.`)
}

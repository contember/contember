import { EntityListAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import type { FieldName } from '../treeParameters'
import type { SortedEntities } from './SortedEntities'

export const throwNoopError = (callbackName: keyof SortedEntities) => {
	throw new BindingError(
		`Cannot invoke '${callbackName}' in non-sortable mode. The 'sortByField' parameter of the 'useSortedEntities' ` +
			`hook is undefined.`,
	)
}

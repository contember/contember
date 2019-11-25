import { EntityListAccessor } from '../accessors'
import { ExpectedEntityCount, FieldName, Filter } from '../treeParameters'
import { useEntityContext } from './useEntityContext'

// TODO delete this
export const useEntityListAccessor = (field: FieldName, filter?: Filter) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ExpectedEntityCount.PossiblyMany, filter)

	if (!(desiredField instanceof EntityListAccessor)) {
		return undefined
	}
	return desiredField
}

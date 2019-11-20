import { ExpectedCount, FieldName, Filter } from '../bindingTypes'
import { EntityListAccessor } from '../accessors'
import { useEntityContext } from './useEntityContext'

export const useEntityListAccessor = (field: FieldName, filter?: Filter) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ExpectedCount.PossiblyMany, filter)

	if (!(desiredField instanceof EntityListAccessor)) {
		return undefined
	}
	return desiredField
}

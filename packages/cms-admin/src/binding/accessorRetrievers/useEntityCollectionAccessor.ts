import { FieldName, Filter } from '../bindingTypes'
import { EntityCollectionAccessor, ReferenceMarker } from '../dao'
import { useEntityContext } from './useEntityContext'

export const useEntityCollectionAccessor = (field: FieldName, filter?: Filter) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.PossiblyMany, filter)

	if (!(desiredField instanceof EntityCollectionAccessor)) {
		return undefined
	}
	return desiredField
}

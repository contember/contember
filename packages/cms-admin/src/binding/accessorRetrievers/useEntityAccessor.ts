import { Input } from '@contember/schema'
import { GraphQlBuilder } from 'cms-client'
import { FieldName, Filter } from '../bindingTypes'
import { EntityAccessor, ReferenceMarker } from '../dao'
import { useEntityContext } from './useEntityContext'

export const useEntityAccessor = (
	field: FieldName,
	filter?: Filter,
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.UpToOne, filter, reducedBy)

	if (!(desiredField instanceof EntityAccessor)) {
		return undefined
	}
	return desiredField
}

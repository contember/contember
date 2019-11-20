import { Input } from '@contember/schema'
import { GraphQlBuilder } from '@contember/client'
import { ExpectedCount, FieldName, Filter } from '../bindingTypes'
import { EntityAccessor } from '../accessors'
import { useEntityContext } from './useEntityContext'

export const useEntityAccessor = (
	field: FieldName,
	filter?: Filter,
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ExpectedCount.UpToOne, filter, reducedBy)

	if (!(desiredField instanceof EntityAccessor)) {
		return undefined
	}
	return desiredField
}

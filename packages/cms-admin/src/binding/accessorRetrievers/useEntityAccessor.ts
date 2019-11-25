import { GraphQlBuilder } from '@contember/client'
import { Input } from '@contember/schema'
import { EntityAccessor } from '../accessors'
import { ExpectedEntityCount, FieldName, Filter } from '../treeParameters'
import { useEntityContext } from './useEntityContext'

// TODO delete this
export const useEntityAccessor = (
	field: FieldName,
	filter?: Filter,
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ExpectedEntityCount.UpToOne, filter, reducedBy)

	if (!(desiredField instanceof EntityAccessor)) {
		return undefined
	}
	return desiredField
}

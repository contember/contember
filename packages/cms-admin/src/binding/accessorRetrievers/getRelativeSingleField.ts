import { GraphQlBuilder } from '@contember/client'
import { EntityAccessor, FieldAccessor } from '../accessors'
import { Scalar } from '../accessorTree'
import { DataBindingError } from '../dao'
import { RelativeSingleField } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'

export const getRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	relativeTo: EntityAccessor,
	{ fieldName, hasOneRelationPath }: RelativeSingleField,
) => {
	const nestedEntity = getRelativeSingleEntity(relativeTo, { hasOneRelationPath })
	const field = nestedEntity.data.getField(fieldName)

	if (!(field instanceof FieldAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return (field as unknown) as FieldAccessor<Persisted, Produced>
}

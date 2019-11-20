import { GraphQlBuilder } from '@contember/client'
import { FieldName } from '../bindingTypes'
import { ToOne } from '../coreComponents'
import { EntityAccessor, FieldAccessor } from '../accessors'
import { Scalar } from '../accessorTree'
import { DataBindingError } from '../dao'
import { getNestedEntity } from './getNestedEntity'

export const getNestedField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	entity: EntityAccessor,
	toOneProps: ToOne.AtomicPrimitiveProps[],
	fieldName: FieldName,
) => {
	const nestedEntity = getNestedEntity(entity, toOneProps)
	const field = nestedEntity.data.getField(fieldName)

	if (!(field instanceof FieldAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return (field as unknown) as FieldAccessor<Persisted, Produced>
}

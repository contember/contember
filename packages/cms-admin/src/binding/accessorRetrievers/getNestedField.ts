import { GraphQlBuilder } from 'cms-client'
import { FieldName, Scalar } from '../bindingTypes'
import { ToOne } from '../coreComponents'
import { DataBindingError, EntityAccessor, FieldAccessor } from '../dao'
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

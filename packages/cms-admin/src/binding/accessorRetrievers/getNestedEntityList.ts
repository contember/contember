import { ToMany, ToOne } from '../coreComponents'
import { DataBindingError, EntityAccessor, EntityCollectionAccessor } from '../dao'
import { getNestedEntity } from './getNestedEntity'

export const getNestedEntityList = (
	entity: EntityAccessor,
	toOneProps: ToOne.AtomicPrimitiveProps[],
	toManyProps: ToMany.AtomicPrimitiveProps,
): EntityCollectionAccessor => {
	const nestedEntity = getNestedEntity(entity, toOneProps)
	const field = nestedEntity.data.getField(toManyProps.field)

	if (!(field instanceof EntityCollectionAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return field
}
